import { randomUUID } from "crypto";
import ApiError from "../../utils/ApiError.js";
import { pool } from "../../database/db.js";
import { getEventByIdRepository } from "../events/event.repository.js";
import {
  createBookingRepository,
  decrementSeats,
  incrementSeats,
} from "./booking.repository.js";
import {
  createSeatHoldRepository,
  getSeatHoldByUserAndEventRepository,
  getSeatHoldByIdRepository,
  deleteSeatHoldRepository,
  deleteExpiredSeatHoldsRepository,
} from "./seat-hold.repository.js";
import { seatHoldQueue } from "../../queues/seat-hold.queue.js";

const HOLD_DURATION_MS = 5 * 60 * 1000;

export const createSeatHoldService = async (userId, eventId, seatsHeld) => {
  await deleteExpiredSeatHoldsRepository();

  const events = await getEventByIdRepository(eventId);
  if (events.length === 0)
    throw new ApiError(404, "Event not found or not approved");

  const event = events[0];

  const existing = await getSeatHoldByUserAndEventRepository(userId, eventId);
  if (existing.length > 0)
    throw new ApiError(
      409,
      "You already have an active seat hold for this event",
    );

  const holdId = randomUUID();
  const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const decrResult = await decrementSeats(conn, event.id, seatsHeld);
    if (decrResult.affectedRows === 0)
      throw new ApiError(400, "Not enough available seats to hold");

    await createSeatHoldRepository(
      conn,
      holdId,
      userId,
      event.id,
      seatsHeld,
      expiresAt,
    );

    await conn.commit();

    seatHoldQueue
      .add(
        `seat-hold-expiry-${holdId}`,
        { holdId },
        { delay: HOLD_DURATION_MS },
      )
      .catch((err) =>
        console.error(
          `Failed to enqueue delayed seat hold expiry: ${err.message}`,
        ),
      );

    return { holdId, eventId: event.id, seatsHeld, expiresAt };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const cancelSeatHoldService = async (holdId, userId) => {
  const holds = await getSeatHoldByIdRepository(holdId);
  if (holds.length === 0) throw new ApiError(404, "Hold not found");

  const hold = holds[0];

  if (hold.user_id !== userId)
    throw new ApiError(403, "You are not authorized to cancel this hold");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await deleteSeatHoldRepository(conn, holdId);
    await incrementSeats(conn, hold.event_id, hold.seats_held);

    await conn.commit();
    return { cancelled: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getSeatHoldService = async (userId, eventId) => {
  const holds = await getSeatHoldByUserAndEventRepository(userId, eventId);
  if (holds.length === 0) return null;

  const hold = holds[0];
  const msRemaining = new Date(hold.expires_at).getTime() - Date.now();
  return {
    holdId: hold.id,
    seatsHeld: hold.seats_held,
    expiresAt: hold.expires_at,
    secondsRemaining: Math.max(0, Math.floor(msRemaining / 1000)),
  };
};

export const convertSeatHoldToBookingService = async (
  conn,
  holdId,
  bookingId,
) => {
  const holds = await getSeatHoldByIdRepository(holdId);
  if (holds.length === 0)
    throw new ApiError(404, "Seat hold not found or already expired");

  const hold = holds[0];

  if (new Date(hold.expires_at) < new Date())
    throw new ApiError(410, "Seat hold has expired");

  await deleteSeatHoldRepository(conn, holdId);

  const result = await createBookingRepository(
    conn,
    bookingId,
    hold.user_id,
    hold.event_id,
    hold.seats_held,
  );

  return {
    bookingId,
    userId: hold.user_id,
    eventId: hold.event_id,
    seats: hold.seats_held,
  };
};
