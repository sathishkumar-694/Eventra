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
    .refine((date) => date > new Date(), "Event date must be in the future"),

  price: z.number().min(0, "Price cannot be negative"),

  total_seats: z
    .number()
    .int("Total seats must be an integer")
    .positive("Total seats must be greater than 0"),

  category: z.enum(["Tech", "Music", "Art", "Business", "General", "Sports"]).default("General").optional(),
});

export const updateEventSchema = createEventSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

export const getEventsQuerySchema = z.object({
  search: z.string().trim().optional(),
  location: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  date: z.string().optional(),
  category: z.string().trim().optional(),
  dateFilter: z.enum(["today", "weekend", "next-week"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["event_date", "price", "created_at"]).default("created_at"),
});
