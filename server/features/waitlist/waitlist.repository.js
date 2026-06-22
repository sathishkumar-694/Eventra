import { pool } from "../../database/db.js";

export const getWaitlistByUserAndEventRepository = async (userId, eventId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM waitlist WHERE user_id = ? AND event_id = ?",
    [userId, eventId],
  );
  return rows;
};

export const getWaitlistPositionRepository = async (userId, eventId) => {
  const [rows] = await pool.execute(
    `SELECT w.*, 
            (SELECT COUNT(*) FROM waitlist w2 
             WHERE w2.event_id = ? AND w2.position <= w.position AND w2.status = 'WAITING') AS queue_position
     FROM waitlist w
     WHERE w.user_id = ? AND w.event_id = ?`,
    [eventId, userId, eventId],
  );
  return rows;
};

export const createWaitlistRepository = async (waitlistId, userId, eventId, position) => {
  const [result] = await pool.execute(
    "INSERT INTO waitlist (id, user_id, event_id, position) VALUES (?, ?, ?, ?)",
    [waitlistId, userId, eventId, position],
  );
  return result;
};

export const getNextWaitlistPositionRepository = async (eventId) => {
  const [[row]] = await pool.execute(
    "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM waitlist WHERE event_id = ?",
    [eventId],
  );
  return row.next_position;
};

export const deleteWaitlistRepository = async (userId, eventId) => {
  const [result] = await pool.execute(
    "DELETE FROM waitlist WHERE user_id = ? AND event_id = ?",
    [userId, eventId],
  );
  return result;
};

export const getFirstWaitlistRepository = async (eventId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM waitlist 
     WHERE event_id = ? AND status = 'WAITING' 
     ORDER BY position ASC 
     LIMIT 1`,
    [eventId],
  );
  return rows;
};

export const updateWaitlistStatusRepository = async (waitlistId, status) => {
  const [result] = await pool.execute(
    "UPDATE waitlist SET status = ? WHERE id = ?",
    [status, waitlistId],
  );
  return result;
};

export const getWaitlistCountRepository = async (eventId) => {
  const [[row]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM waitlist WHERE event_id = ? AND status = 'WAITING'",
    [eventId],
  );
  return row.total;
};
