import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { migrateExistingFreelancerVerifications } from './services/freelancerVerificationService.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import investorRoutes from './routes/investorRoutes.js';
import matchingRoutes from './routes/matchingRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import startupHiringRoutes from './routes/startupHiringRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import fundingRoutes from './routes/fundingRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Middleware Imports
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { protectSocket } from './middleware/authMiddleware.js';
import { createNotification, setSocketIO } from './services/notificationService.js';
import ChatMessage from './models/Chat.js';
import Connection from './models/Connection.js';

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5174',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    message: 'Bridge backend is healthy and connected.',
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ success: true, status: 'online' });
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/startup-hiring', startupHiringRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Middleware (must stay at the bottom)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5174',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use(protectSocket);
setSocketIO(io);

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();

  socket.join(userId);

  socket.on('joinChat', async ({ connectionId }) => {
    if (!mongoose.Types.ObjectId.isValid(connectionId)) return;

    const connection = await Connection.findById(connectionId);
    if (!connection || connection.status !== 'accepted') return;

    const isParticipant = connection.requester.toString() === userId ||
                          connection.recipient.toString() === userId;
    if (!isParticipant) return;

    socket.join(`chat:${connectionId}`);
  });

  socket.on('leaveChat', ({ connectionId }) => {
    if (!mongoose.Types.ObjectId.isValid(connectionId)) return;
    socket.leave(`chat:${connectionId}`);
  });

  socket.on('sendMessage', async ({ connectionId, content, messageType = 'text', fileUrl, fileName, fileSize }) => {
    if (!mongoose.Types.ObjectId.isValid(connectionId)) return;
    if (!content?.trim() && messageType === 'text') return;

    const connection = await Connection.findById(connectionId);
    if (!connection || connection.status !== 'accepted') return;

    const isParticipant = connection.requester.toString() === userId ||
                          connection.recipient.toString() === userId;
    if (!isParticipant) return;

    const message = await ChatMessage.create({
      connectionId,
      senderId: userId,
      content: content?.trim() || '',
      messageType,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      readBy: [userId],
    });

    await message.populate('senderId', 'name email role profileImage');

    const recipientId = connection.requester.toString() === userId
      ? connection.recipient.toString()
      : connection.requester.toString();

    await createNotification({
      recipient: recipientId,
      sender: userId,
      type: 'message_received',
      title: 'New Message',
      message: `${socket.user.name}: ${content?.substring(0, 100) || 'Sent a file'}`,
      relatedId: connectionId,
      relatedModel: 'Connection',
      link: `/chat/${connectionId}`,
    });

    io.to(`chat:${connectionId}`).emit('newMessage', message);
    io.to(recipientId).emit('messageNotification', { connectionId, message });
  });

  socket.on('markAsRead', async ({ connectionId }) => {
    if (!mongoose.Types.ObjectId.isValid(connectionId)) return;

    const connection = await Connection.findById(connectionId);
    if (!connection || connection.status !== 'accepted') return;

    const isParticipant = connection.requester.toString() === userId ||
                          connection.recipient.toString() === userId;
    if (!isParticipant) return;

    await ChatMessage.updateMany(
      { connectionId, readBy: { $ne: userId }, senderId: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    io.to(`chat:${connectionId}`).emit('messagesRead', { connectionId, readBy: userId });
  });

  socket.on('disconnect', () => {});
});

const startServer = async () => {
  try {
    const result = await migrateExistingFreelancerVerifications();
    console.log(
      `Freelancer verification migration complete: ${result.checked} freelancers checked, ${result.migrated} documents synced.`
    );
  } catch (error) {
    console.error('Freelancer verification migration failed:', error.message);
  }

  httpServer.listen(PORT, '0.0.0.0', { ipv6Only: false }, () =>
    console.log(`Bridge server running on port ${PORT} (dual stack) with Socket.io`)
  );
};

startServer();