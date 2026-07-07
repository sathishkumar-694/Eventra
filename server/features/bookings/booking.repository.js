import { pool } from "../../database/db.js";

export const getUserBookingRepository = async(userId)=>
{
    const [result] = await pool.execute(
        `SELECT b.*, e.title AS event_title, e.event_date, e.location, e.description, e.price 
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`,
        [userId]
    ) ;
    return result;
}

export const getBookingsByIdRepository = async(bookingId, userId)=>
{
    const [result] = await pool.execute(
        `SELECT b.*, e.title AS event_title, e.event_date, e.location, e.description, e.price 
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE b.id = ? AND b.user_id = ?`,
        [bookingId, userId]
    ) ;
    return result;
}

export const createBookingRepository = async (conn, bookingId, userId, eventId, seatsBooked) => {
    const [result] = await conn.execute(
        "INSERT INTO bookings (id, user_id, event_id, ticket_count) VALUES (?, ?, ?, ?)",
        [bookingId, userId, eventId, seatsBooked]
    );
    return result;
};

export const cancelBookingRepository = async (conn, bookingId) => {
    const [result] = await conn.execute(
        "UPDATE bookings SET booking_status = ? WHERE id = ?",
        ["CANCELLED", bookingId]
    );
    return result;
};

export const decrementSeats = async (conn, eventId, seats) => {
    const [result] = await conn.execute(
        "UPDATE events SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?",
        [seats, eventId, seats]
    );
    return result;
};

export const incrementSeats = async (conn, eventId, seats) => {
    const [result] = await conn.execute(
        "UPDATE events SET available_seats = available_seats + ? WHERE id = ?",
        [seats, eventId]
    );
    return result;
};
