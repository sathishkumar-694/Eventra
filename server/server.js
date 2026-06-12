import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { testDB } from "./database/db.js";
import authRoutes from "./features/auth/auth.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import eventRoutes from "./features/events/event.routes.js";
import adminRoutes from "./features/admin/admin.routes.js";
import bookingRoutes from "./features/bookings/booking.routes.js";
import roleRoutes from "./features/role/role.routes.js";
dotenv.config();

const PORT = process.env.PORT;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);
app.use(helmet());

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/roles", roleRoutes);

app.get("/health", async (req, res) => {
  try {
    const data = await testDB();

    return res.status(200).json({
      success: true,
      message: "DB connected",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to connect",
      error: error.message,
    });
  }
});
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log("Server is running successfully on port", PORT);
});
