import { AppError } from "../shared/errors/index.js";
import config from "../config/index.js";

/**
 * Global Express error handler.
 * Must be the last middleware registered in app.js.
 *
 * Security properties:
 *  - In production, non-operational errors return a generic message (no internals).
 *  - Field names from Mongoose CastErrors are not surfaced to clients.
 *  - Stack traces are only logged server-side; never sent in the response.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "An unexpected error occurred.";
  let code       = err.code       || "INTERNAL_ERROR";
  let details    = err.details    || null;

  // ── Mongoose duplicate key error ────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    code       = "CONFLICT";
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message    = `An account with this ${field} already exists.`;
  }

  // ── Mongoose validation error ───────────────────────────────────────────────
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    code       = "VALIDATION_ERROR";
    message    = "Validation failed.";
    details    = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
  }

  // ── Mongoose cast error — do NOT expose the field path to clients ───────────
  if (err.name === "CastError") {
    statusCode = 400;
    code       = "INVALID_REQUEST";
    message    = "The request contains an invalid value.";
  }

  // ── CORS errors ─────────────────────────────────────────────────────────────
  if (err.message?.startsWith("CORS:")) {
    statusCode = 403;
    code       = "FORBIDDEN";
    message    = "Request origin is not allowed.";
  }

  // ── Log unexpected (non-operational) errors server-side only ────────────────
  const isOperational = err instanceof AppError && err.isOperational;
  if (!isOperational) {
    // Log full error including stack in development; sanitised version in production
    if (config.env === "development") {
      console.error("[Unhandled Error]", err);
    } else {
      console.error(`[Unhandled Error] ${err.name}: ${err.message}`);
    }
    // Never send internal details to clients in production
    if (config.env === "production") {
      message = "An unexpected error occurred. Please try again later.";
      details = null;
      code    = "INTERNAL_ERROR";
    }
  }

  const body = { success: false, message, code };
  if (details) body.details = details;

  return res.status(statusCode).json(body);
}
