import {
  createEventRepository,
  deleteEventRepository,
  getAllEventsRepository,
  getEventByIdRepository,
  getEventByNameRepository,
  updateEventRepository,
  getOrganizerEventsRepository,
  getDistinctLocationsRepository,
  cancelAllEventBookingsRepository,
  getEventAttendeesRepository,
  getOrganizerAnalyticsRepository,
} from "./event.repository.js";

import ApiError from "../../utils/ApiError.js";
import { randomUUID } from "crypto";
import { pool } from "../../database/db.js";
import { emailQueue } from "../../queues/email.queue.js";
import { createNotificationService } from "../notifications/notification.service.js";

export const getAllEventsService = async (filters) => {
  const repositoryFilters = { ...filters };
  if (filters.dateFilter) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    if (filters.dateFilter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      repositoryFilters.startDate = start;
      repositoryFilters.endDate = end;
    } else if (filters.dateFilter === "weekend") {
      const daysToSaturday = (6 - dayOfWeek + 7) % 7;
      const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const start = new Date(now);
      start.setDate(now.getDate() + daysToSaturday);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(now.getDate() + daysToSunday);
      end.setHours(23, 59, 59, 999);
      repositoryFilters.startDate = start;
      repositoryFilters.endDate = end;
    } else if (filters.dateFilter === "next-week") {
      const daysToNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const start = new Date(now);
      start.setDate(now.getDate() + daysToNextMonday);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      repositoryFilters.startDate = start;
      repositoryFilters.endDate = end;
    }
  }
  const response = await getAllEventsRepository(repositoryFilters);
  return response;
};

export const getOrganizerEventsService = async (userId) => {
  const response = await getOrganizerEventsRepository(userId);
  return response;
};

export const getEventByIdService = async (id) => {
  const response = await getEventByIdRepository(id);

  if (response.length === 0 || response[0].approval_status !== "APPROVED") {
    throw new ApiError(404, "Event not found");
  }

  return response[0];
};

export const createEventService = async (eventData, userId) => {
  const eventExists = await getEventByNameRepository(eventData.title);

  if (eventExists.length > 0) {
    throw new ApiError(409, "Event already exists");
  }

  const public_id = randomUUID();

  const result = await createEventRepository(eventData, public_id, userId);

  return {
    id: public_id,
    affectedRows: result.affectedRows,
  };
};

export const updateEventService = async (eventId, eventData, userId) => {
  const events = await getEventByIdRepository(eventId);

  if (events.length === 0) {
    throw new ApiError(404, "Event not found");
  }

  const event = events[0];

  if (event.organizer_id !== userId) {
    throw new ApiError(403, "You are not authorized to update this event");
  }

  if (eventData.title != null) {
    const check = await getEventByNameRepository(eventData.title);
    if (check.length > 0 && check[0].id !== eventId)
      throw new ApiError(400, "Event with the name already exists");
  }

  const result = await updateEventRepository(eventId, eventData);

  if (result.changedRows === 0) {
    throw new ApiError(500, "Failed to update event");
  }

  return result;
};

export const deleteEventService = async (eventId, userId) => {
  const events = await getEventByIdRepository(eventId);

  if (events.length === 0) {
    throw new ApiError(404, "Event not found");
  }

  const event = events[0];

  if (event.organizer_id !== userId) {
    throw new ApiError(403, "You are not authorized to delete this event");
  }

  const result = await deleteEventRepository(eventId);

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Event not found");
  }

  return result;
};

export const getDistinctLocationsService = async () => {
  return await getDistinctLocationsRepository();
};

export const cancelEventService = async (eventId, userId) => {
  const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [eventId]);
  if (rows.length === 0) {
    throw new ApiError(404, "Event not found");
  }

  const event = rows[0];
  if (event.organizer_id !== userId) {
    throw new ApiError(403, "You are not authorized to cancel this event");
  }

  if (event.approval_status === "CANCELLED") {
    throw new ApiError(400, "Event is already cancelled");
  }

  const attendees = await getEventAttendeesRepository(eventId);
  const activeBookings = attendees.filter(b => b.booking_status === "CONFIRMED" || b.booking_status === "BOOKED");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await updateEventRepository(eventId, { approval_status: "CANCELLED" });
    await cancelAllEventBookingsRepository(conn, eventId);

    await conn.commit();

    for (const booking of activeBookings) {
      createNotificationService(
        booking.user_id,
        "Event Cancelled",
        `⚠️ The event "${event.title}" has been cancelled by the host. A refund of your tickets has been processed.`,
        "cancellation"
      ).catch(err => console.error("Notification creation failed:", err));

      emailQueue.add(`event-cancel-notify-${booking.id}`, {
        type: "booking-cancellation",
        to: booking.email,
        payload: {
          username: booking.username,
          eventTitle: event.title,
          seats: booking.ticket_count,
        },
      }).catch(err => console.error(`Failed to enqueue email: ${err.message}`));
    }
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getEventAttendeesService = async (eventId, userId) => {
  const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [eventId]);
  if (rows.length === 0) {
    throw new ApiError(404, "Event not found");
  }

  const event = rows[0];
  if (event.organizer_id !== userId) {
    throw new ApiError(403, "You are not authorized to view attendees for this event");
  }

  return await getEventAttendeesRepository(eventId);
};

export const getOrganizerAnalyticsService = async (userId) => {
  return await getOrganizerAnalyticsRepository(userId);
};
