import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const email = 'admin@bridge.com';
    let adminUser = await User.findOne({ email });

    if (!adminUser) {
      adminUser = await User.create({
        name: 'Bridge Admin',
        email,
        password: 'AdminPassword123!',
        role: 'admin',
        isVerified: true,
      });
      console.log('✅ Admin user created successfully!');
    } else {
      adminUser.role = 'admin';
      adminUser.isVerified = true;
      adminUser.isBlocked = false;
      await adminUser.save();
      console.log('✅ Existing user promoted to admin!');
    }

    console.log('Email:    admin@bridge.com');
    console.log('Password: AdminPassword123!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();