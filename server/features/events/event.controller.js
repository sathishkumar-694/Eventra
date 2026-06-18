import {
  createEventService,
  getAllEventsService,
  getEventByIdService,
  updateEventService,
  deleteEventService,
  getOrganizerEventsService,
} from "./event.service.js";

export const getAllEventsController = async (req, res, next) => {
  try {
    const response = await getAllEventsService(req.query);
    return res.status(200).json({
      success: true,
      page: req.query.page,
      limit: req.query.limit,
      count: response.length,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrganizerEventsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const response = await getOrganizerEventsService(userId);

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

export const getEventByIdController = async (req, res, next) => {
  try {
    const response = await getEventByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

export const createEventController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const data = await createEventService(req.body, userId);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateEventController = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    await updateEventService(eventId, req.body, userId);

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const deleteEventController = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    await deleteEventService(eventId, userId);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
