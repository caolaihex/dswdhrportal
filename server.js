import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import announcementRoutes from "./routes/announcementRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import employeeDtrRoutes from "./routes/employeeDtrRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("MongoDB server is running");
});

app.use("/", authRoutes);
app.use("/", announcementRoutes);
app.use("/", leaveRoutes);
app.use("/", auditRoutes);
app.use("/", employeeDtrRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});