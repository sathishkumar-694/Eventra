import { pool } from "../../database/db.js";

export const getAllEventsRepository = async ({
  search,
  location,
  minPrice,
  maxPrice,
  date,
  page,
  limit,
  sortBy,
}) => {
  let query = "SELECT * FROM events WHERE approval_status = 'APPROVED'";
  const params = [];

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
      organizer_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
