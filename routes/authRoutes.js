import express from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

import User from "../models/User.js";
import OtpCode from "../models/OtpCode.js";
import OtpAttempt from "../models/OtpAttempt.js";

dotenv.config();

const router = express.Router();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "LOADED" : "NOT LOADED");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = password || "";

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user || user.password !== cleanPassword) {
      return res.status(401).json({
        success: false,
        message: "Wrong email or password",
      });
    }

    const firstName = user.firstName || user.firstname || user.first_name || "";
    const lastName = user.lastName || user.lastname || user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        firstName,
        lastName,
        first_name: firstName,
        last_name: lastName,
        name: fullName || "HR User",
        role: user.role,
        gender: user.gender || "",
        birthday: user.birthday || "",
        age: user.age || "",
        address: user.address || "",
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// SEND OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const attemptData = await OtpAttempt.findOne({ email: cleanEmail });

    if (
      attemptData?.blockedUntil &&
      new Date(attemptData.blockedUntil) > new Date()
    ) {
      const secondsLeft = Math.ceil(
        (new Date(attemptData.blockedUntil) - new Date()) / 1000
      );

      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${secondsLeft} seconds.`,
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await OtpCode.deleteMany({
      email: cleanEmail,
      is_used: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpCode.create({
      email: cleanEmail,
      otp_code: otp,
      expires_at: expiresAt,
      is_used: false,
    });

    await transporter.sendMail({
      from: `"DSWD HR PORTAL" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject: "DSWD HR Portal OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f7fb; padding:30px;">
          <div style="max-width:500px; margin:auto; background:white; border-radius:12px; padding:25px;">
            <h2 style="color:#073b82;">DSWD HR PORTAL</h2>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing:6px; color:#d71920; font-size:38px;">${otp}</h1>
            <p>This OTP will expire in <b>5 minutes</b>.</p>
          </div>
        </div>
      `,
    });

    console.log("OTP SENT TO:", cleanEmail);
    console.log("OTP CODE:", otp);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanOtp = (otp || "").trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    let attemptData = await OtpAttempt.findOne({ email: cleanEmail });

    if (!attemptData) {
      attemptData = await OtpAttempt.create({
        email: cleanEmail,
        failedAttempts: 0,
        blockedUntil: null,
      });
    }

    if (
      attemptData.blockedUntil &&
      new Date(attemptData.blockedUntil) > new Date()
    ) {
      const secondsLeft = Math.ceil(
        (new Date(attemptData.blockedUntil) - new Date()) / 1000
      );

      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${secondsLeft} seconds.`,
      });
    }

    const otpRecord = await OtpCode.findOne({
      email: cleanEmail,
      otp_code: cleanOtp,
      is_used: false,
      expires_at: { $gt: new Date() },
    }).sort({ created_at: -1 });

    if (!otpRecord) {
      attemptData.failedAttempts += 1;

      if (attemptData.failedAttempts >= 5) {
        attemptData.failedAttempts = 5;
        attemptData.blockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        await attemptData.save();

        return res.status(429).json({
          success: false,
          message:
            "You failed 5 times. Please wait 5 minutes before trying again.",
        });
      }

      await attemptData.save();

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - attemptData.failedAttempts} attempt(s) left.`,
      });
    }

    attemptData.failedAttempts = 0;
    attemptData.blockedUntil = null;
    await attemptData.save();

    otpRecord.is_used = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
});

// GET PROFILE
router.get("/users/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const firstName = user.firstName || user.firstname || user.first_name || "";
    const lastName = user.lastName || user.lastname || user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email || "",
        firstName,
        lastName,
        first_name: firstName,
        last_name: lastName,
        name: fullName || "Employee",
        role: user.role || "viewer",
        gender: user.gender || "",
        birthday: user.birthday || "",
        age: user.age || "",
        address: user.address || "",
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

// UPDATE PROFILE BY ID
router.put("/users/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      email,
      password,
      gender,
      birthday,
      age,
      address,
      profileImage,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and email are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingEmail = await User.findOne({
      email: cleanEmail,
      _id: { $ne: id },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is already used by another account",
      });
    }

    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: cleanEmail,
      gender: gender || "",
      birthday: birthday || "",
      age: age || "",
      address: address || "",
      profileImage: profileImage || "",
    };

    if (password && password.trim() !== "") {
      updateData.password = password.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const fullName = `${updatedUser.firstName || ""} ${
      updatedUser.lastName || ""
    }`.trim();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        first_name: updatedUser.firstName || "",
        last_name: updatedUser.lastName || "",
        name: fullName || "Employee",
        role: updatedUser.role || "employee",
        gender: updatedUser.gender || "",
        birthday: updatedUser.birthday || "",
        age: updatedUser.age || "",
        address: updatedUser.address || "",
        profileImage: updatedUser.profileImage || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

// UPDATE PROFILE BY EMAIL
router.put("/update-profile", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      gender,
      birthday,
      age,
      address,
      profileImage,
      password,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const updateData = {
      firstName,
      lastName,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName || ""} ${lastName || ""}`.trim(),
      gender,
      birthday,
      age,
      address,
      profileImage,
    };

    if (password && password.trim() !== "") {
      updateData.password = password.trim();
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// TEST USERS
router.get("/test-users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

export default router;