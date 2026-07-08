import { randomUUID } from "crypto";
import {
  getUserNotificationsRepository,
  createNotificationRepository,
  markNotificationReadRepository,
  markAllNotificationsReadRepository,
} from "./notification.repository.js";

export const getUserNotificationsService = async (userId) => {
  return await getUserNotificationsRepository(userId);
};

export const createNotificationService = async (userId, title, message, type) => {
  const id = randomUUID();
  await createNotificationRepository(id, userId, title, message, type);
  return { id, userId, title, message, type, isRead: 0 };
};

export const markNotificationReadService = async (id, userId) => {
  return await markNotificationReadRepository(id, userId);
};

export const markAllNotificationsReadService = async (userId) => {
  return await markAllNotificationsReadRepository(userId);
};
