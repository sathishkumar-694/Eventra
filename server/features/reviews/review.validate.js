import { z } from "zod";

export const createReviewSchema = z.object({
  eventId: z.string().uuid("eventId must be a valid UUID"),
  rating: z
    .number({ required_error: "rating is required" })
    .int("rating must be a whole number")
    .min(1, "rating must be at least 1")
    .max(5, "rating cannot exceed 5"),
  comment: z
    .string()
    .trim()
    .max(500, "comment cannot exceed 500 characters")
    .optional(),
});
