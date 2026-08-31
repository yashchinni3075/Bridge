import { Router } from "express";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/users", userRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

export default router;
