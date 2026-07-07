import { randomUUID } from "crypto";
import ApiError from "../../utils/ApiError.js";
import { pool } from "../../database/db.js";
import { getEventByIdRepository } from "../events/event.repository.js";
import {
  cancelBookingRepository,
  createBookingRepository,
  decrementSeats,
  getBookingsByIdRepository,
  getUserBookingRepository,
  incrementSeats,
} from "./booking.repository.js";
import { notifyWaitlistService } from "../waitlist/waitlist.service.js";
import { getSeatHoldByIdRepository, deleteSeatHoldRepository } from "./seat-hold.repository.js";
import { findUserById } from "../auth/auth.repository.js";
import { deleteWaitlistRepository } from "../waitlist/waitlist.repository.js";
import { emailQueue } from "../../queues/email.queue.js";

export const createBookingService = async (userId, eventId, seatsBooked, holdId = null) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let targetEventId = eventId;
    let targetSeatsBooked = seatsBooked;

    if (holdId) {
      const holds = await getSeatHoldByIdRepository(holdId);
      if (holds.length === 0)
        throw new ApiError(404, "Seat hold not found or already expired");

      const hold = holds[0];

      if (hold.user_id !== userId)
        throw new ApiError(403, "You are not authorized to convert this seat hold");

      if (new Date(hold.expires_at) < new Date())
        throw new ApiError(410, "Seat hold has expired");

      targetEventId = hold.event_id;
      targetSeatsBooked = hold.seats_held;

      await deleteSeatHoldRepository(conn, holdId);
    } else {
      const events = await getEventByIdRepository(targetEventId);
      if (events.length === 0)
        throw new ApiError(404, "Event not found or not approved");

      const event = events[0];

      const decrement = await decrementSeats(conn, event.id, targetSeatsBooked);
      if (decrement.affectedRows === 0)
        throw new ApiError(400, "Not enough available seats");
    }

    const bookingId = randomUUID();
    const result = await createBookingRepository(
      conn,
      bookingId,
      userId,
      targetEventId,
      targetSeatsBooked,
    );
    if (result.affectedRows === 0)
      throw new ApiError(500, "Failed to create booking");

    await deleteWaitlistRepository(userId, targetEventId);

    let eventTitle = "Event";
    let eventPrice = 0;
    try {
      const events = await getEventByIdRepository(targetEventId);
      if (events.length > 0) {
        eventTitle = events[0].title;
        eventPrice = events[0].price;
      }
    } catch (err) {}

    await conn.commit();

    findUserById(userId)
      .then((user) => {
        if (user) {
          emailQueue.add(`booking-confirm-${bookingId}`, {
            type: "booking-confirmation",
            to: user.email,
            payload: {
              username: user.username,
              eventTitle,
              seats: targetSeatsBooked,
              price: eventPrice * targetSeatsBooked,
            },
          }).catch(err => console.error(`Failed to enqueue booking confirmation email: ${err.message}`));
        }
      })
      .catch(err => console.error(`Failed to fetch user: ${err.message}`));

    return { id: bookingId, affectedRows: result.affectedRows };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getUserBookingsService = async (userId) => {
  const result = await getUserBookingRepository(userId);
  return result;
};

export const cancelBookingService = async (bookingId, userId) => {
  const bookings = await getBookingsByIdRepository(bookingId, userId);
  if (bookings.length === 0)
    throw new ApiError(404, "Booking not found or you are not authorized");

  const booking = bookings[0];

  if (booking.booking_status === "CANCELLED")
    throw new ApiError(400, "Booking is already cancelled");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const result = await cancelBookingRepository(conn, bookingId);
    if (result.affectedRows === 0)
      throw new ApiError(500, "Failed to cancel booking");

    await incrementSeats(conn, booking.event_id, booking.ticket_count);

    let eventTitle = "Event";
    try {
      const events = await getEventByIdRepository(booking.event_id);
      if (events.length > 0) {
        eventTitle = events[0].title;
      }
    } catch (err) {}

    await conn.commit();

    findUserById(userId)
      .then((user) => {
        if (user) {
          emailQueue.add(`booking-cancel-${bookingId}`, {
            type: "booking-cancellation",
            to: user.email,
            payload: {
              username: user.username,
              eventTitle,
              seats: booking.ticket_count,
            },
          }).catch(err => console.error(`Failed to enqueue booking cancellation email: ${err.message}`));
        }
      })
      .catch(err => console.error(`Failed to fetch user: ${err.message}`));

    await notifyWaitlistService(booking.event_id);

    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const validateBookingPublicService = async (bookingId) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.ticket_count, b.booking_status, e.title AS event_title, e.event_date, e.location, u.username 
     FROM bookings b 
     JOIN events e ON b.event_id = e.id 
     JOIN users u ON b.user_id = u.id 
     WHERE b.id = ?`,
    [bookingId]
  );
  if (rows.length === 0) {
    return { valid: false, message: "Ticket not found or invalid ID" };
  }
  const booking = rows[0];
  if (booking.booking_status !== "CONFIRMED" && booking.booking_status !== "BOOKED") {
    return { valid: false, message: `Ticket is ${booking.booking_status.toLowerCase()}` };
  }
  return {
    valid: true,
    eventTitle: booking.event_title,
    eventDate: booking.event_date,
    location: booking.location,
    username: booking.username,
    ticketCount: booking.ticket_count,
  };
};
