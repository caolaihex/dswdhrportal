import mongoose from "mongoose";

const otpAttemptSchema = new mongoose.Schema(
  {
    email: String,
    failedAttempts: {
      type: Number,
      default: 0,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const OtpAttempt = mongoose.model(
  "OtpAttempt",
  otpAttemptSchema,
  "otp_attempts"
);

export default OtpAttempt;