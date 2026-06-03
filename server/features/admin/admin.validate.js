import { z } from "zod";

export const rejectEventSchema = z.object({
  reason: z
    .string({
      required_error: "Reason is required",
    })
    .trim()
    .min(10, "Reason must be at least 10 characters long"),
});
