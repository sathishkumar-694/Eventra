import {
  createEventRepository,
  deleteEventRepository,
  getAllEventsRepository,
  getEventByIdRepository,
  getEventByNameRepository,
  updateEventRepository,
  getOrganizerEventsRepository,
} from "./event.repository.js";

import ApiError from "../../utils/ApiError.js";
import { randomUUID } from "crypto";

export const getAllEventsService = async () => {
  const response = await getAllEventsRepository();

  if (!response) {
    throw new ApiError(500, "Could not fetch events");
  }
  
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

  const result = await updateEventRepository(eventId, eventData);

  if (result.affectedRows === 0) {
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
    throw new ApiError(500, "Failed to delete event");
  }

  return result;
};
