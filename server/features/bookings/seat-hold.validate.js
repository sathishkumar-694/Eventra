import { z } from "zod";

export const createSeatHoldSchema = z.object({
  eventId: z.string().uuid("eventId must be a valid UUID"),
  seatsHeld: z
    .number({ required_error: "seatsHeld is required" })
    .int("seatsHeld must be a whole number")
    .min(1, "Must hold at least 1 seat")
    .max(10, "Cannot hold more than 10 seats at once"),
});
