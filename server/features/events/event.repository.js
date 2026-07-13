import { pool } from "../../database/db.js";

export const getAllEventsRepository = async ({
  search,
  location,
  minPrice,
  maxPrice,
  date,
  category,
  startDate,
  endDate,
  page,
  limit,
  sortBy,
}) => {
  let query = "SELECT * FROM events WHERE approval_status = 'APPROVED'";
  const params = [];

  if (!date && !startDate && !endDate) {
    query += " AND event_date >= NOW()";
  }

  if (search) {
    query += " AND title LIKE ?";
    params.push(`%${search}%`);
  }
  if (location) {
    query += " AND location LIKE ?";
    params.push(`%${location}%`);
  }
  if (minPrice !== undefined) {
    query += " AND price >= ?";
    params.push(minPrice);
  }
  if (maxPrice !== undefined) {
    query += " AND price <= ?";
    params.push(maxPrice);
  }
  if (date) {
    query += " AND DATE(event_date) = ?";
    params.push(date);
  }
  if (category && category !== "All") {
    query += " AND category = ?";
    params.push(category);
  }
  if (startDate) {
    query += " AND event_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    query += " AND event_date <= ?";
    params.push(endDate);
  }

  query += ` ORDER BY ${sortBy} DESC LIMIT ? OFFSET ?`;
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(query, params);
  return rows;
};

export const getEventByIdRepository = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE id =? AND approval_status = ?",
    [id, "APPROVED"],
  );
  return rows;
};

export const getEventByNameRepository = async (name) => {
  const [rows] = await pool.query("SELECT * FROM events WHERE title = ?", [
    name,
  ]);
  return rows;
};

export const getOrganizerEventsRepository = async (userId) => {
  const [rows] = await pool.query(
    "SELECT * FROM events WHERE organizer_id = ?",
    [userId],
  );
  return rows;
};

export const createEventRepository = async (eventData, public_id, userId) => {
  const [result] = await pool.query(
    `
    INSERT INTO events (
      id,
      title,
      description,
      location,
      event_date,
      price,
      total_seats,
      available_seats,
      organizer_id,
      category
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      public_id,
      eventData.title,
      eventData.description ?? null,
      eventData.location,
      eventData.event_date,
      eventData.price,
      eventData.total_seats,
      eventData.total_seats,
      userId,
      eventData.category || "General",
    ],
  );

  return result;
};

export const updateEventRepository = async (eventId, updateData) => {
  const fields = [];
  const values = [];

  Object.entries(updateData).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });

  values.push(eventId);

  const [result] = await pool.query(
    `
    UPDATE events
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values,
  );

  return result;
};

export const deleteEventRepository = async (eventId) => {
  const [result] = await pool.query(
    `
    DELETE FROM events
    WHERE id = ?
    `,
    [eventId],
  );

  return result;
};

export const getDistinctLocationsRepository = async () => {
  const [rows] = await pool.query(
    "SELECT DISTINCT location FROM events WHERE approval_status = 'APPROVED'",
  );
  return rows.map((r) => r.location);
};

export const cancelAllEventBookingsRepository = async (conn, eventId) => {
  const [result] = await conn.execute(
    "UPDATE bookings SET booking_status = 'CANCELLED' WHERE event_id = ? AND booking_status IN ('CONFIRMED', 'BOOKED')",
    [eventId],
  );
  return result;
};

export const getEventAttendeesRepository = async (eventId) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.ticket_count, b.booking_status, b.created_at, u.username, u.email 
     FROM bookings b 
     JOIN users u ON b.user_id = u.id 
     WHERE b.event_id = ?
     ORDER BY b.created_at DESC`,
    [eventId],
  );
  return rows;
};

export const getOrganizerAnalyticsRepository = async (organizerId) => {
  const [[{ totalEvents }]] = await pool.query(
    "SELECT COUNT(*) AS totalEvents FROM events WHERE organizer_id = ?",
    [organizerId],
  );

  const [[{ totalTicketsSold }]] = await pool.query(
    `SELECT COALESCE(SUM(b.ticket_count), 0) AS totalTicketsSold 
     FROM bookings b 
     JOIN events e ON b.event_id = e.id 
     WHERE e.organizer_id = ? AND b.booking_status IN ('CONFIRMED', 'BOOKED')`,
    [organizerId],
  );

  const [[{ totalRevenue }]] = await pool.query(
    `SELECT COALESCE(SUM(b.ticket_count * e.price), 0) AS totalRevenue 
     FROM bookings b 
     JOIN events e ON b.event_id = e.id 
     WHERE e.organizer_id = ? AND b.booking_status IN ('CONFIRMED', 'BOOKED')`,
    [organizerId],
  );

  const [[{ seatsSold, totalSeats }]] = await pool.query(
    `SELECT COALESCE(SUM(e.total_seats - e.available_seats), 0) AS seatsSold, 
            COALESCE(SUM(e.total_seats), 0) AS totalSeats 
     FROM events e 
     WHERE e.organizer_id = ? AND e.approval_status != 'REJECTED'`,
    [organizerId],
  );

  const [eventBreakdown] = await pool.query(
    `SELECT id, title, total_seats, available_seats, price, approval_status,
            (total_seats - available_seats) AS sold_seats,
            ((total_seats - available_seats) * price) AS event_revenue
     FROM events 
     WHERE organizer_id = ?`,
    [organizerId],
  );

  const occupancyRate =
    totalSeats > 0 ? Math.round((seatsSold / totalSeats) * 100) : 0;

  return {
    totalEvents,
    totalTicketsSold,
    totalRevenue,
    occupancyRate,
    eventBreakdown,
  };
};
