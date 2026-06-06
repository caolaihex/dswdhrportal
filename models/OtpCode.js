import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: String,
    otp_code: String,
    expires_at: Date,
    is_used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const OtpCode = mongoose.model(
  "OtpCode",
  otpSchema,
  "otp_codes"
);

export default OtpCode;