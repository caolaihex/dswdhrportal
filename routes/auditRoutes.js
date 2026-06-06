import express from "express";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();

router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
});

router.post("/audit-logs", async (req, res) => {
  try {
    const { user, role, action, type, date } = req.body;

    const log = await AuditLog.create({
      user: user || "Unknown User",
      role: role || "NO ROLE",
      action: action || "Performed an action",
      type: type || "activity",
      date:
        date ||
        new Date().toLocaleString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
    });

    res.json({
      success: true,
      message: "Audit log saved successfully",
      log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save audit log",
      error: error.message,
    });
  }
});

export default router;