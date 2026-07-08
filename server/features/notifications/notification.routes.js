import express from "express";
import { getMe } from "../../middleware/auth.middleware.js";
import {
  getUserNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "./notification.controller.js";

const notificationRoutes = express.Router();

notificationRoutes.get("/", getMe, getUserNotificationsController);
notificationRoutes.patch("/read-all", getMe, markAllNotificationsReadController);
notificationRoutes.patch("/:id/read", getMe, markNotificationReadController);

export default notificationRoutes;
