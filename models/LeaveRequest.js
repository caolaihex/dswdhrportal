import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: String,
    leaveType: String,
    date: String,
    reason: String,
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

const LeaveRequest = mongoose.model(
  "LeaveRequest",
  leaveRequestSchema,
  "leave_requests"
);

export default LeaveRequest;