import { z } from "zod";

// ─── Reusable field definitions ───────────────────────────────────────────────

const emailField = z
  .string({ required_error: "Email is required." })
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address.");

/**
 * Password must be at least 8 characters and contain:
 *  - one uppercase letter
 *  - one lowercase letter
 *  - one digit
 *  - one special character
 */
const passwordField = z
  .string({ required_error: "Password is required." })
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must not exceed 128 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one digit.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required." })
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must not exceed 100 characters.")
    // Strip characters that could cause stored XSS when rendered in HTML contexts
    .transform((val) => val.replace(/[<>"'`]/g, "").trim())
    .refine((val) => val.length >= 2, "Full name must be at least 2 characters."),
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: "Password is required." })
    .min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: "Reset token is required." })
    .min(1, "Reset token is required."),
  password: passwordField,
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required." })
    .min(1, "Current password is required."),
  newPassword: passwordField,
});
