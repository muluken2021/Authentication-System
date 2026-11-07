import rateLimit from "express-rate-limit";
import config from "../config/index.js";

// In test mode, use a permissive limiter so tests never hit 429.
const isTest = config.env === "test";

/**
 * Strict rate limiter for sensitive auth endpoints (login, register, forgot-password).
 * Allows 10 requests per 15 minutes per IP.
 */
export const authLimiter = isTest
  ? rateLimit({ windowMs: 1000, max: 1000 })
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      // Use X-Forwarded-For only when explicitly behind a trusted proxy.
      // Set APP_TRUST_PROXY=1 in production when behind a load balancer / reverse proxy.
      skip: false,
      message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes.",
        code: "TOO_MANY_REQUESTS",
      },
    });

/**
 * Rate limiter for the token refresh endpoint.
 * Slightly more permissive than auth (silent background calls), but still bounded.
 * Allows 30 requests per 15 minutes per IP.
 */
export const refreshLimiter = isTest
  ? rateLimit({ windowMs: 1000, max: 1000 })
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many token refresh requests. Please try again later.",
        code: "TOO_MANY_REQUESTS",
      },
    });

/**
 * General API rate limiter.
 * Allows 100 requests per 15 minutes per IP.
 */
export const generalLimiter = isTest
  ? rateLimit({ windowMs: 1000, max: 10000 })
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many requests. Please try again later.",
        code: "TOO_MANY_REQUESTS",
      },
    });
