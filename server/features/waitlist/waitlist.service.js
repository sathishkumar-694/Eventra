import { randomUUID } from "crypto";
import ApiError from "../../utils/ApiError.js";
import { getEventByIdRepository } from "../events/event.repository.js";

import {
  getWaitlistByUserAndEventRepository,
  getWaitlistPositionRepository,
  createWaitlistRepository,
  getNextWaitlistPositionRepository,
  deleteWaitlistRepository,
  getFirstWaitlistRepository,
  updateWaitlistStatusRepository,
  getWaitlistCountRepository,
} from "./waitlist.repository.js";

export const createWaitlistService = async (userId, eventId) => {
  const events = await getEventByIdRepository(eventId);
  if (events.length === 0)
    throw new ApiError(404, "Event not found or not approved");

  const event = events[0];

  if (event.available_seats > 0)
    throw new ApiError(400, "This event still has available seats. Book directly instead of joining the waitlist.");

  const existing = await getWaitlistByUserAndEventRepository(userId, eventId);
  if (existing.length > 0)
    throw new ApiError(409, "You are already on the waitlist for this event");

  const position = await getNextWaitlistPositionRepository(eventId);
  const waitlistId = randomUUID();

  const result = await createWaitlistRepository(waitlistId, userId, eventId, position);
  if (result.affectedRows === 0)
    throw new ApiError(500, "Failed to join waitlist");

  return { id: waitlistId, eventId, position };
};

export const getWaitlistPositionService = async (userId, eventId) => {
  const rows = await getWaitlistPositionRepository(userId, eventId);
  if (rows.length === 0)
    throw new ApiError(404, "You are not on the waitlist for this event");

  const entry = rows[0];
  const totalWaiting = await getWaitlistCountRepository(eventId);

  return {
    id: entry.id,
    position: entry.queue_position,
    status: entry.status,
    totalWaiting,
    joinedAt: entry.created_at,
  };
};

export const deleteWaitlistService = async (userId, eventId) => {
  const existing = await getWaitlistByUserAndEventRepository(userId, eventId);
  if (existing.length === 0)
    throw new ApiError(404, "You are not on the waitlist for this event");

  const result = await deleteWaitlistRepository(userId, eventId);
  if (result.affectedRows === 0)
    throw new ApiError(500, "Failed to leave waitlist");

  return { left: true };
};

import { findUserById } from "../auth/auth.repository.js";
import { emailQueue } from "../../queues/email.queue.js";
import { waitlistQueue } from "../../queues/waitlist.queue.js";

export const notifyWaitlistService = async (eventId) => {
  const waiting = await getFirstWaitlistRepository(eventId);
  if (waiting.length === 0) return null;

  const next = waiting[0];
  await updateWaitlistStatusRepository(next.id, "NOTIFIED");

  try {
    const user = await findUserById(next.user_id);
    const events = await getEventByIdRepository(eventId);
    const event = events[0];

    if (user && event) {
      emailQueue.add(`waitlist-notify-${next.id}`, {
        type: "waitlist-notify",
        to: user.email,
        payload: {
          username: user.username,
          eventTitle: event.title,
        },
      }).catch(err => console.error(`Failed to enqueue waitlist email: ${err.message}`));

      waitlistQueue.add(
        `waitlist-timeout-${next.id}`,
        {
          waitlistId: next.id,
          eventId,
          userId: next.user_id,
        },
        {
          delay: 30 * 60 * 1000,
        }
      ).catch(err => console.error(`Failed to enqueue waitlist timeout job: ${err.message}`));
    }
  } catch (err) {
    console.error(`Failed to fetch user/event for waitlist promotion: ${err.message}`);
  }

  return { notifiedUserId: next.user_id, waitlistId: next.id };
};
