import { z } from "zod";

export const createBookingSchema = z.object({
  eventId: z.string().uuid("Event ID must be a valid UUID").optional(),

  seats_booked: z
    .coerce
    .number()
    .int("seats_booked must be an integer")
    .positive("seats_booked must be greater than 0")
    .optional(),

  holdId: z.string().uuid("Hold ID must be a valid UUID").optional(),
}).refine(data => data.holdId || (data.eventId && data.seats_booked), {
  message: "Either holdId or both eventId and seats_booked must be provided",
  path: ["holdId"]
});
