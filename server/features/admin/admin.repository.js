import { pool } from "../../database/db.js";

export const getAllEventsRepository = async () => {
  const [rows] = await pool.query("SELECT * FROM events");
  return rows;
};

export const getEventByIdRepository = async (id) => {
  const [rows, fields] = await pool.query(
    "SELECT * FROM events where id = ?",
    id,
  );

  return rows;
};
export const getAllPendingEventsRepository = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE approval_status = ?",
    ["PENDING"],
  );
  return rows;
};

export const getApprovedEventsRepository = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE approval_status = ?",
    ["APPROVED"],
  );
  return rows;
};

export const getRejectedEventsRepository = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE approval_status = ?",
    ["REJECTED"],
  );
  return rows;
};

export const approveEventsRepository = async (id, adminId) => {
  const [rows, fields] = await pool.query(
    "UPDATE events SET approval_status = ? , approved_by = ? where id = ? ",
    ["APPROVED", adminId, id],
  );
  return rows;
};

export const rejectEventsRepository = async (id, reason, adminId) => {
  const [rows, fields] = await pool.query(
    "UPDATE events SET approval_status = ? , rejection_reason = ?, approved_by = ? where id = ?",
    ["REJECTED", reason, adminId, id],
  );
  return rows;
};

export const getAllPendingRoleRequestsRepository = async () => {
  const [rows] = await pool.query(
    `SELECT rr.id, rr.user_id, rr.reason, rr.status, rr.created_at,
            u.username AS user_name, u.email AS user_email
     FROM organizer_requests rr
     JOIN users u ON u.id = rr.user_id
     ORDER BY rr.created_at DESC`,
  );
  return rows;
};

export const updateRoleRequestStatusRepository = async (
  requestId,
  status,
  adminId,
  rejectionReason = null,
) => {
  const [result] = await pool.execute(
    "UPDATE organizer_requests SET status = ?, reviewed_by = ?, rejection_reason = ? WHERE id = ?",
    [status, adminId, rejectionReason, requestId],
  );
  return result;
};

export const updateUserRoleRepository = async (userId, role) => {
  const [result] = await pool.execute(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, userId],
  );
  return result;
};

export const getStatsRepository = async () => {
  const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");
  const [[{ totalEvents }]] = await pool.query("SELECT COUNT(*) AS totalEvents FROM events");
  const [[{ totalBookings }]] = await pool.query("SELECT COUNT(*) AS totalBookings FROM bookings WHERE booking_status = 'CONFIRMED'");
  const [[{ totalRevenue }]] = await pool.query(
    `SELECT COALESCE(SUM(e.price * b.ticket_count), 0) AS totalRevenue
     FROM bookings b
     JOIN events e ON e.id = b.event_id
     WHERE b.booking_status = 'CONFIRMED'`
  );
  const [topEvents] = await pool.query(
    `SELECT e.id, e.title, COUNT(b.id) AS bookingCount
     FROM events e
     LEFT JOIN bookings b ON b.event_id = e.id AND b.booking_status = 'CONFIRMED'
     GROUP BY e.id, e.title
     ORDER BY bookingCount DESC
     LIMIT 5`
  );

  return { totalUsers, totalEvents, totalBookings, totalRevenue, topEvents };
};

