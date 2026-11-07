/**
 * Central application configuration
 * All values are read from environment variables at access time (lazy getters)
 * so that test files can set process.env before they are consumed.
 */

const config = {
  get env() { return process.env.NODE_ENV || "development"; },
  get port() { return parseInt(process.env.PORT, 10) || 5000; },

  db: {
    get uri() { return process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bizfinance"; },
  },

  jwt: {
    get accessSecret() { return process.env.JWT_ACCESS_SECRET; },
    get refreshSecret() { return process.env.JWT_REFRESH_SECRET; },
    get accessExpiresIn() { return process.env.JWT_ACCESS_EXPIRES_IN || "15m"; },
    get refreshExpiresIn() { return process.env.JWT_REFRESH_EXPIRES_IN || "7d"; },
    // Numeric seconds for the expiresIn response field
    accessExpiresInSeconds: 15 * 60,       // 15 minutes
    refreshExpiresInSeconds: 7 * 24 * 60 * 60, // 7 days
  },

  client: {
    get url() { return process.env.CLIENT_URL || "http://localhost:5173"; },
  },

  cookie: {
    get secure() { return process.env.COOKIE_SECURE === "true"; },
    get sameSite() { return process.env.COOKIE_SAME_SITE || "lax"; },
  },

  email: {
    get host()     { return process.env.EMAIL_HOST; },
    get port()     { return parseInt(process.env.EMAIL_PORT, 10) || 587; },
    get user()     { return process.env.EMAIL_USER; },
    get password() { return process.env.EMAIL_PASSWORD; },
    get from()     { return process.env.EMAIL_FROM; },
    /** True only when all four required vars are present */
    get isConfigured() {
      return Boolean(
        process.env.EMAIL_HOST &&
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD &&
        process.env.EMAIL_FROM
      );
    },
  },

  google: {
    get clientId()       { return process.env.GOOGLE_CLIENT_ID; },
    get clientSecret()   { return process.env.GOOGLE_CLIENT_SECRET; },
    get callbackUrl()    { return process.env.GOOGLE_CALLBACK_URL; },
    get isConfigured() {
      return Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CALLBACK_URL
      );
    },
  },

  frontend: {
    get url() { return process.env.CLIENT_URL || "http://localhost:5173"; },
  },
};

/**
 * Validate required secrets are present and meet minimum strength requirements.
 * Fails fast at startup so the server never runs with weak or missing secrets.
 */
export function validateConfig() {
  const required = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGODB_URI"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Enforce minimum secret length (32 chars ≈ 256-bit entropy minimum)
  const MIN_SECRET_LENGTH = 32;
  const weakSecrets = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"].filter(
    (key) => process.env[key].length < MIN_SECRET_LENGTH
  );

  if (weakSecrets.length > 0) {
    throw new Error(
      `JWT secrets are too short (minimum ${MIN_SECRET_LENGTH} characters): ${weakSecrets.join(", ")}`
    );
  }

  // Warn loudly if placeholder values are still in use
  const placeholders = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"].filter(
    (key) =>
      process.env[key]?.startsWith("replace_with") ||
      process.env[key]?.startsWith("REPLACE_WITH")
  );

  if (placeholders.length > 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Placeholder JWT secrets detected in production. Replace ${placeholders.join(", ")} with cryptographically random values.`
      );
    }
    console.warn(
      `[Config] WARNING: Placeholder JWT secrets detected for ${placeholders.join(", ")}. Generate real secrets before deploying.`
    );
  }
}

export default config;
