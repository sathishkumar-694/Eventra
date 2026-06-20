import { pool } from "../../database/db.js";

export const createSeatHoldRepository = async (
  conn,
  holdId,
  userId,
  eventId,
  seatsHeld,
  expiresAt,
) => {
  const [result] = await conn.execute(
    `INSERT INTO seat_holds (id, user_id, event_id, seats_held, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [holdId, userId, eventId, seatsHeld, expiresAt],
  );
  return result;
};

export const getSeatHoldByUserAndEventRepository = async (userId, eventId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM seat_holds
     WHERE user_id = ? AND event_id = ? AND expires_at > NOW()
     LIMIT 1`,
    [userId, eventId],
  );
  return rows;
};

export const getSeatHoldByIdRepository = async (holdId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM seat_holds WHERE id = ?",
    [holdId],
  );
  return rows;
};

export const deleteSeatHoldRepository = async (conn, holdId) => {
  const [result] = await conn.execute(
    "DELETE FROM seat_holds WHERE id = ?",
    [holdId],
  );
  return result;
};

export const deleteExpiredSeatHoldsRepository = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [expired] = await conn.execute(
      "SELECT * FROM seat_holds WHERE expires_at <= NOW()",
    );

    if (expired.length > 0) {
      await conn.execute("DELETE FROM seat_holds WHERE expires_at <= NOW()");

      for (const hold of expired) {
        await conn.execute(
          "UPDATE events SET available_seats = available_seats + ? WHERE id = ?",
          [hold.seats_held, hold.event_id],
        );
      }
    }

    await conn.commit();
    return expired;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
