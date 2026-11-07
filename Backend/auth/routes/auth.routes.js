import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as googleController from "../controllers/google.controller.js";
import { authenticate } from "../../../middleware/authenticate.js";
import { validate } from "../../../middleware/validate.js";
import { authLimiter, refreshLimiter } from "../../../middleware/rateLimiter.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.validators.js";

const router = Router();

// ─── Public endpoints ─────────────────────────────────────────────────────────

/** POST /api/v1/auth/register */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);

/** POST /api/v1/auth/login */
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);

/** POST /api/v1/auth/refresh */
router.post("/refresh", refreshLimiter, authController.refresh);

/** POST /api/v1/auth/forgot-password */
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/** POST /api/v1/auth/reset-password */
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ─── Google OAuth endpoints ───────────────────────────────────────────────────

/** GET /api/v1/auth/google — initiate OAuth flow */
router.get("/google", googleController.initiateGoogleAuth);

/** GET /api/v1/auth/google/callback — handle Google redirect */
router.get("/google/callback", googleController.googleCallback);

/** GET /api/v1/auth/google/token — consume the short-lived OAuth handoff cookie */
router.get("/google/token", googleController.getGoogleToken);

// ─── Protected endpoints (require valid access token) ─────────────────────────

/** GET /api/v1/auth/me */
router.get("/me", authenticate, authController.getMe);

/** POST /api/v1/auth/logout */
router.post("/logout", authenticate, authController.logout);

/** PATCH /api/v1/auth/change-password */
router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
