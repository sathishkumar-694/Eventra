import { randomUUID } from "crypto";
import ApiError from "../../utils/ApiError.js";
import {
  getConfirmedBookingByUserAndEventRepository,
  getReviewByUserAndEventRepository,
  createReviewRepository,
  getReviewsByEventRepository,
  getReviewByIdRepository,
  deleteReviewRepository,
  getAverageRatingByEventRepository,
} from "./review.repository.js";

export const createReviewService = async (userId, eventId, rating, comment) => {
  const attended = await getConfirmedBookingByUserAndEventRepository(userId, eventId);
  if (attended.length === 0)
    throw new ApiError(403, "You can only review events you have attended");

  const existing = await getReviewByUserAndEventRepository(userId, eventId);
  if (existing.length > 0)
    throw new ApiError(409, "You have already reviewed this event");

  const reviewId = randomUUID();
  const result = await createReviewRepository(reviewId, userId, eventId, rating, comment);
  if (result.affectedRows === 0)
    throw new ApiError(500, "Failed to create review");

  return { id: reviewId, eventId, rating, comment };
};

export const getReviewsByEventService = async (eventId) => {
  const reviews = await getReviewsByEventRepository(eventId);
  const stats = await getAverageRatingByEventRepository(eventId);
  return { stats, reviews };
};

export const deleteReviewService = async (reviewId, userId) => {
  const reviews = await getReviewByIdRepository(reviewId);
  if (reviews.length === 0)
    throw new ApiError(404, "Review not found");

  const review = reviews[0];
  if (review.user_id !== userId)
    throw new ApiError(403, "You are not authorized to delete this review");

  const result = await deleteReviewRepository(reviewId);
  if (result.affectedRows === 0)
    throw new ApiError(500, "Failed to delete review");

  return result;
};
