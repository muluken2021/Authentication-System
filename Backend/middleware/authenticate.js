import { verifyAccessToken } from "../shared/utils/jwt.js";
import User from "../modules/auth/models/User.model.js";
import { AuthenticationError, AuthorizationError } from "../shared/errors/index.js";
import { USER_STATUS } from "../shared/constants/index.js";

/**
 * Authenticate middleware.
 *
 * Expects: Authorization: Bearer <accessToken>
 *
 * On success: attaches the full User document to req.user and calls next().
 * On failure: passes an AppError to next() for the global error handler.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Access token is required.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AuthenticationError("Access token is required.");
    }

    // Throws AuthenticationError if token is invalid or expired
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub);

    if (!user) {
      throw new AuthenticationError("User no longer exists.");
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new AuthorizationError("Your account has been suspended. Please contact support.");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
