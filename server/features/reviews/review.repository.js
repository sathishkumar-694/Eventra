import { pool } from "../../database/db.js";

export const getConfirmedBookingByUserAndEventRepository = async (userId, eventId) => {
  const [rows] = await pool.execute(
    `SELECT b.id FROM bookings b
     JOIN events e ON e.id = b.event_id
     WHERE b.user_id = ?
       AND b.event_id = ?
       AND b.booking_status = 'CONFIRMED'
       AND e.event_date < NOW()
     LIMIT 1`,
    [userId, eventId],
  );
  return rows;
};

export const getReviewByUserAndEventRepository = async (userId, eventId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM reviews WHERE user_id = ? AND event_id = ?",
    [userId, eventId],
  );
  return rows;
};

export const createReviewRepository = async (reviewId, userId, eventId, rating, comment) => {
  const [result] = await pool.execute(
    "INSERT INTO reviews (id, event_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
    [reviewId, eventId, userId, rating, comment ?? null],
  );
  return result;
};

export const getReviewsByEventRepository = async (eventId) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.rating, r.comment, r.created_at,
            u.username, u.id AS user_id
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.event_id = ?
     ORDER BY r.created_at DESC`,
    [eventId],
  );
  return rows;
};

export const getReviewByIdRepository = async (reviewId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM reviews WHERE id = ?",
    [reviewId],
  );
  return rows;
};

export const deleteReviewRepository = async (reviewId) => {
  const [result] = await pool.execute(
    "DELETE FROM reviews WHERE id = ?",
    [reviewId],
  );
  return result;
};

export const getAverageRatingByEventRepository = async (eventId) => {
  const [[row]] = await pool.execute(
    "SELECT ROUND(AVG(rating), 1) AS averageRating, COUNT(*) AS totalReviews FROM reviews WHERE event_id = ?",
    [eventId],
  );
  return row;
};
