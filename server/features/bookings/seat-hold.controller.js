import {
  createSeatHoldService,
  cancelSeatHoldService,
  getSeatHoldService,
} from "./seat-hold.service.js";

export const createSeatHoldController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId, seatsHeld } = req.body;

    const data = await createSeatHoldService(userId, eventId, seatsHeld);

    return res.status(201).json({
      success: true,
      message: "Seats held for 5 minutes. Complete payment before hold expires.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelSeatHoldController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const holdId = req.params.id;

    await cancelSeatHoldService(holdId, userId);

    return res.status(200).json({
      success: true,
      message: "Seat hold cancelled successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getSeatHoldController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.query;

    if (!eventId)
      return res
        .status(400)
        .json({ success: false, message: "eventId query param is required" });

    const data = await getSeatHoldService(userId, eventId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
