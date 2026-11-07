import mongoose from "mongoose";
import { hashPassword, comparePassword } from "../../../shared/utils/hash.js";
import { USER_STATUS, BCRYPT_ROUNDS } from "../../../shared/constants/index.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters."],
      maxlength: [100, "Full name must not exceed 100 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },

    password: {
      type: String,
      // Not required — OAuth users have no password
      minlength: [8, "Password must be at least 8 characters."],
      select: false,
    },

    // ─── Google OAuth ──────────────────────────────────────────────────────
    googleId: {
      type: String,
      sparse: true, // allows null for non-OAuth users while keeping uniqueness
      unique: true,
      index: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },

    // Password-reset fields stored on the user document
    passwordResetTokenHash: {
      type: String,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    // Remove __v from query results
    versionKey: false,
  }
);

// ─── Pre-save hook: hash password when it changes ────────────────────────────
// Mongoose 9 supports async pre hooks without a `next` callback.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hashPassword(this.password);
});

// ─── Instance method: verify a plain-text password ───────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return comparePassword(candidate, this.password);
};

// ─── Instance method: safe public representation (no sensitive fields) ────────
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    isEmailVerified: this.isEmailVerified,
    status: this.status,
    authProvider: this.authProvider,
    createdAt: this.createdAt,
  };
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email uniqueness is already enforced by `unique: true` in the schema field —
// no need to also call schema.index() which creates a duplicate.

const User = mongoose.model("User", userSchema);

export default User;
