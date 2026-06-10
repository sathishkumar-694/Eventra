import { randomUUID } from "crypto";
import ApiError from "../../utils/ApiError.js";
import { getEventByIdRepository } from "../events/event.repository.js";
import {
  cancelBookingRepository,
  createBookingRepository,
  decrementSeats,
  getBookingsByIdRepository,
  getUserBookingRepository,
  incrementSeats,
} from "./bookings.repository.js";

export const createBookingService = async (userId, eventId, seatsBooked) => {
  const events = await getEventByIdRepository(eventId);
  if (events.length === 0)
    throw new ApiError(404, "Event not found or not approved");

  const event = events[0];

  const decrement = await decrementSeats(event.id, seatsBooked);
  if (decrement.affectedRows === 0)
    throw new ApiError(400, "Not enough available seats");

  const bookingId = randomUUID();
  const result = await createBookingRepository(
    bookingId,
    userId,
    event.id,
    seatsBooked,
  );

  if (result.affectedRows === 0)
    throw new ApiError(500, "Failed to create booking");

  return { id: bookingId, affectedRows: result.affectedRows };
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

  const result = await cancelBookingRepository(bookingId);
  if (result.affectedRows === 0)
    throw new ApiError(500, "Failed to cancel booking");

  await incrementSeats(booking.event_id, booking.ticket_count);

  return result;
};
