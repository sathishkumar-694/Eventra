import { pool } from "../../database/db.js";

export const getUserNotificationsRepository = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [userId]
  );
  return rows;
};

export const createNotificationRepository = async (id, userId, title, message, type) => {
  const [result] = await pool.query(
    "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)",
    [id, userId, title, message, type]
  );
  return result;
};

export const markNotificationReadRepository = async (id, userId) => {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result;
};

export const markAllNotificationsReadRepository = async (userId) => {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
    [userId]
  );
  return result;
};
