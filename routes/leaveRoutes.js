import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";

const router = express.Router();

router.get("/leave-requests", async (req, res) => {
  try {
    const requests = await LeaveRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
      error: error.message,
    });
  }
});

router.post("/leave-requests", async (req, res) => {
  try {
    const { employee, leaveType, date, reason, status } = req.body;

    const request = await LeaveRequest.create({
      employee: employee || "",
      leaveType: leaveType || "",
      date: date || "",
      reason: reason || "",
      status: status || "Pending",
    });

    res.json({
      success: true,
      message: "Leave request saved successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save leave request",
      error: error.message,
    });
  }
});

router.put("/leave-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await LeaveRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    res.json({
      success: true,
      message: "Leave request updated successfully",
      request: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update leave request",
      error: error.message,
    });
  }
});

export default router;