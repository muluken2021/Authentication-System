import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import config from "./config/index.js";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

const app = express();

// ─── Trust proxy ──────────────────────────────────────────────────────────────
// Required for accurate IP-based rate limiting when behind a reverse proxy or
// load balancer (Nginx, AWS ALB, etc.).
// Set to 1 to trust the first X-Forwarded-For hop; adjust for your topology.
if (process.env.APP_TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Allow the backend's own redirect to accounts.google.com
        "default-src": ["'self'", "https://accounts.google.com"],
      },
    },
    // Prevent browsers from sniffing MIME types
    noSniff: true,
    // Deny iframe embedding (clickjacking protection)
    frameguard: { action: "deny" },
    // Force HTTPS in production
    hsts: config.env === "production"
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    // Disable X-Powered-By: Express header
    hidePoweredBy: true,
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Only the explicitly configured frontend origin is allowed.
// This is read from CLIENT_URL and must be an exact match (no wildcards).
const allowedOrigin = config.client.url;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (no Origin header) and the configured frontend
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
      }
    },
    credentials: true,          // required for cross-origin cookie handling
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,              // cache preflight for 24 hours
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Cookie parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── HTTP request logger ──────────────────────────────────────────────────────
// Use a custom format that omits the query string to prevent reset tokens
// (delivered in URLs like /reset-password?token=...) from appearing in logs.
if (config.env !== "test") {
  const safeFormat = ":method :url-path :status :response-time ms";

  // Custom token: log only the path, never the query string
  morgan.token("url-path", (req) => {
    try {
      return new URL(req.originalUrl, "http://localhost").pathname;
    } catch {
      return req.path;
    }
  });

  app.use(morgan(safeFormat));
}

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use(generalLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, message: "BizFinance API is running." });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api/v1", apiRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "The requested resource was not found.",
    code: "NOT_FOUND",
  });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
