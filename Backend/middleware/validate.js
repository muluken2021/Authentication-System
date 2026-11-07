import { ZodError } from "zod";
import { ValidationError } from "../shared/errors/index.js";

/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On failure, passes a ValidationError to next() with structured field errors.
 *
 * @param {import("zod").ZodSchema} schema
 * @returns {import("express").RequestHandler}
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        next(new ValidationError("Validation failed.", details));
      } else {
        next(err);
      }
    }
  };
}
