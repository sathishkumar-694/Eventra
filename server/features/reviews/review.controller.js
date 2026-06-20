import {
  createReviewService,
  getReviewsByEventService,
  deleteReviewService,
} from "./review.service.js";

export const createReviewController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId, rating, comment } = req.body;

    const data = await createReviewService(userId, eventId, rating, comment);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getReviewsByEventController = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const data = await getReviewsByEventService(eventId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteReviewController = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    await deleteReviewService(reviewId, userId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
