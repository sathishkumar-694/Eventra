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
            u.username AS username, u.email AS email
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
  const [[{ pendingEvents }]] = await pool.query("SELECT COUNT(*) AS pendingEvents FROM events WHERE approval_status = 'PENDING'");
  const [[{ totalBookings }]] = await pool.query("SELECT COUNT(*) AS totalBookings FROM bookings WHERE booking_status IN ('CONFIRMED', 'BOOKED')");
  const [[{ totalRevenue }]] = await pool.query(
    `SELECT COALESCE(SUM(e.price * b.ticket_count), 0) AS totalRevenue
     FROM bookings b
     JOIN events e ON e.id = b.event_id
     WHERE b.booking_status IN ('CONFIRMED', 'BOOKED')`
  );
  const [topEvents] = await pool.query(
    `SELECT e.id, e.title, COUNT(b.id) AS bookingCount
     FROM events e
     LEFT JOIN bookings b ON b.event_id = e.id AND b.booking_status IN ('CONFIRMED', 'BOOKED')
     GROUP BY e.id, e.title
     ORDER BY bookingCount DESC
     LIMIT 5`
  );

  const [eventAnalysis] = await pool.query(
    `SELECT 
        e.id, 
        e.title, 
        e.event_date,
        u.username AS organizer_name,
        e.price,
        e.total_seats,
        e.available_seats,
        (e.total_seats - e.available_seats) AS seats_sold,
        COALESCE(SUM(b.ticket_count), 0) AS total_tickets_booked,
        COALESCE(SUM(e.price * b.ticket_count), 0) AS revenue,
        e.approval_status
     FROM events e
     LEFT JOIN users u ON u.id = e.organizer_id
     LEFT JOIN bookings b ON b.event_id = e.id AND b.booking_status IN ('CONFIRMED', 'BOOKED')
     GROUP BY e.id, e.title, e.event_date, u.username, e.price, e.total_seats, e.available_seats, e.approval_status
     ORDER BY revenue DESC, total_tickets_booked DESC`
  );

  return {
    totalUsers,
    total_users: totalUsers,
    totalEvents: pendingEvents,
    pending_events: pendingEvents,
    totalBookings,
    total_bookings: totalBookings,
    totalRevenue,
    total_revenue: totalRevenue,
    topEvents,
    eventAnalysis,
    event_analysis: eventAnalysis
  };
};

