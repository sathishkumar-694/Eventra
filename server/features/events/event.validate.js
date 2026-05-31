import { z } from "zod";

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  location: z
    .string()
    .trim()
    .min(3, "Location must be at least 3 characters long")
    .max(255, "Location cannot exceed 255 characters"),

  event_date: z.coerce
    .date()
    .refine(
      (date) => date > new Date(),
      "Event date must be in the future"
    ),

  price: z
    .number()
    .min(0, "Price cannot be negative"),

  total_seats: z
    .number()
    .int("Total seats must be an integer")
    .positive("Total seats must be greater than 0")
});

export const updateEventSchema = createEventSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required for update"
    }
  );