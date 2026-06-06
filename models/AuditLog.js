import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: String,
    role: String,
    action: String,
    type: String,
    date: String,
  },
  { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema, "audit_logs");

export default AuditLog;