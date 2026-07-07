import {
  createBookingService,
  cancelBookingService,
  getUserBookingsService,
  validateBookingPublicService,
} from "./booking.service.js";

export const getUserBookingsController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const data = await getUserBookingsService(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const createBookingController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId, seats_booked, holdId } = req.body;

    const data = await createBookingService(userId, eventId, seats_booked, holdId);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelBookingController = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    await cancelBookingService(bookingId, userId);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const validateBookingPublicController = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const response = await validateBookingPublicService(bookingId);
    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};
