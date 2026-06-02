import { pool } from "../../database/db.js";

export const getAllEventsRepository = async () => {
  const [rows] = await pool.query("SELECT * FROM events where approval_status = ?" , ["APPROVED"]);
  return rows;
};

export const getEventByIdRepository = async (id) => {
  const [rows] = await pool.query("SELECT * FROM events WHERE id =? AND approval_status = ?", [id , "APPROVED"]);
  return rows;
};

export const getEventByNameRepository = async (name) => {
  const [rows] = await pool.query("SELECT * FROM events WHERE title = ? AND approval_status = ?", 
    [name,"APPROVED"]);
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
    [values],
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
