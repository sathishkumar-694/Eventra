import { z } from "zod";

export const createBookingSchema = z.object({
  eventId: z.string().uuid("Event ID must be a valid UUID"),

  seats_booked: z
    .coerce
    .number()
    .int("seats_booked must be an integer")
    .positive("seats_booked must be greater than 0"),
});
