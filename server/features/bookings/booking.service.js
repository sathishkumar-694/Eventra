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

    await conn.commit();
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

    await conn.commit();

    await notifyWaitlistService(booking.event_id);

    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
