import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import domainRouter from "./routes/domain.js";
import pitchRouter from "./routes/pitch.js";

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bridge";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bridge-startup-server" });
});

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/domain-verify", domainRouter);
app.use("/api/pitch-score", pitchRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected:", MONGODB_URI);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Set MONGODB_URI in server/.env to your MongoDB connection string.");
    process.exit(1);
  }

  app.get("/", (req, res) => {
  res.send("Bridge Backend API is running");
});

  app.listen(PORT, () => {
    console.log(`Bridge server listening on http://localhost:${PORT}`);
  });
}

start();
