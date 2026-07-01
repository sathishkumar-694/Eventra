import {
  createWaitlistService,
  getWaitlistPositionService,
  deleteWaitlistService,
  getUserWaitlistsService,
} from "./waitlist.service.js";

export const createWaitlistController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    const data = await createWaitlistService(userId, eventId);

    return res.status(201).json({
      success: true,
      message: "You have been added to the waitlist",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getWaitlistPositionController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    const data = await getWaitlistPositionService(userId, eventId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteWaitlistController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    await deleteWaitlistService(userId, eventId);

    return res.status(200).json({
      success: true,
      message: "You have left the waitlist",
    });
  } catch (err) {
    next(err);
  }
};

export const getUserWaitlistsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await getUserWaitlistsService(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
