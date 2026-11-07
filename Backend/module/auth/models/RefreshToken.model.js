import mongoose from "mongoose";

/**
 * Stores hashed refresh tokens to support:
 *  - multiple independent sessions per user
 *  - refresh-token rotation
 *  - revocation on logout / password change
 *
 * Only the SHA-256 hash of each raw token is persisted.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    // Set when this token has been superseded by a new one (rotation)
    replacedByTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefreshToken",
      default: null,
    },

    // Set to the revocation date when the token is explicitly revoked
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Virtual: is the token still usable? ─────────────────────────────────────
refreshTokenSchema.virtual("isActive").get(function () {
  return !this.revokedAt && this.expiresAt > new Date();
});

// ─── TTL index: MongoDB auto-deletes expired documents ───────────────────────
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
