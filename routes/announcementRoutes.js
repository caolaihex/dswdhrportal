import express from "express";
import Announcement from "../models/Announcement.js";

const router = express.Router();

router.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

router.post("/announcements", async (req, res) => {
  try {
    const { title, message } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
    });

    res.json({
      success: true,
      announcement,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save announcement" });
  }
});

router.put("/announcements", async (req, res) => {
  try {
    const { id, title, message } = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { title, message },
      { new: true }
    );

    res.json({
      success: true,
      announcement,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update announcement",
    });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Announcement deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete announcement",
    });
  }
});

export default router;