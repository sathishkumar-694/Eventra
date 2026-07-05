import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "username should be atleast 3 characters"),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("invalid email"),

    password: z
        .string()
        .trim()
        .min(6, "password should atleast 6 characters")
        .regex(/[A-Za-z]/, "password should contain a letter")
        .regex(/[0-9]/, "password should contain a number")
        .regex(/[^A-Za-z0-9]/, "password should contain a special character"),

    role: z.
    enum(["USER", "ORGANIZER", "ADMIN"])
    .optional(),

    secret: z
    .string()
    .optional()
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("invalid email"),

    password: z
        .string()
        .trim()
        .min(6, "password should atleast 6 characters")
});

export const updateProfileSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "username should be atleast 3 characters")
        .optional(),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("invalid email")
        .optional(),

    currentPassword: z
        .string()
        .trim()
        .min(6, "password should atleast 6 characters")
        .optional(),

    newPassword: z
        .string()
        .trim()
        .min(6, "password should atleast 6 characters")
        .regex(/[A-Za-z]/, "password should contain a letter")
        .regex(/[0-9]/, "password should contain a number")
        .regex(/[^A-Za-z0-9]/, "password should contain a special character")
        .optional(),
});