import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: String,
    message: String,
  },
  { timestamps: true }
);

const Announcement = mongoose.model(
  "Announcement",
  announcementSchema,
  "announcements"
);

export default Announcement;