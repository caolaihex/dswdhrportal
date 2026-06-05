  import express from "express";
  import mongoose from "mongoose";
  import nodemailer from "nodemailer";
  import cors from "cors";
  import dotenv from "dotenv";

  dotenv.config();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // MONGODB CONNECTION
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

  // USER SCHEMA
  const userSchema = new mongoose.Schema(
    {
      email: String,
      password: String,

      firstName: String,
      lastName: String,
      firstname: String,
      lastname: String,
      first_name: String,
      last_name: String,

      role: String,

      gender: String,
      birthday: String,
      age: String,
      address: String,
      profileImage: String,
    },
    { timestamps: true }
  );

  const User = mongoose.model("User", userSchema, "users");

  // OTP SCHEMA
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

  const OtpCode = mongoose.model("OtpCode", otpSchema, "otp_codes");

  // OTP ATTEMPT SCHEMA
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

  // DTR SCHEMA
  const employeeDtrSchema = new mongoose.Schema(
    {
      office: String,
      name: String,
      dateReceived: String,
      positionTitle: String,
      employmentStatus: String,
      dtrData: {
        type: Object,
        default: {},
      },
    },
    { timestamps: true }
  );

  const EmployeeDtr = mongoose.model("EmployeeDtr", employeeDtrSchema);

  // AUDIT LOG SCHEMA
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

  // LEAVE REQUEST SCHEMA
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

  // EMAIL
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.log("EMAIL ERROR:", error);
    } else {
      console.log("Email server is ready");
    }
  });

  // TEST ROUTE
  app.get("/", (req, res) => {
    res.send("MongoDB server is running");
  });

  // LOGIN
  app.post("/login", async (req, res) => {
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

      const firstName =
        user.firstName || user.firstname || user.first_name || "";

      const lastName =
        user.lastName || user.lastname || user.last_name || "";

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
      console.error("LOGIN ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  });

  app.get("/users/:id/profile", async (req, res) => {
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
    console.error("GET PROFILE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});
  // UPDATE USER PROFILE
  app.put("/users/:id/profile", async (req, res) => {
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

      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true,
    runValidators: true,}
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const fullName = `${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`.trim();

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
      console.error("UPDATE PROFILE ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  });

  // SEND OTP
  app.post("/send-otp", async (req, res) => {
    try {
      const { email } = req.body;

      const cleanEmail = (email || "").trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const attemptData = await OtpAttempt.findOne({
        email: cleanEmail,
      });

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
            <div style="max-width:500px; margin:auto; background:white; border-radius:12px; padding:25px; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
              <h2 style="color:#073b82; margin-bottom:5px;">DSWD HR PORTAL</h2>
              <p style="color:#475569;">Department of Social Welfare and Development</p>
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
              <p style="font-size:16px; color:#334155;">Your verification code is:</p>
              <h1 style="letter-spacing:6px; color:#d71920; font-size:38px;">${otp}</h1>
              <p style="color:#475569;">This OTP will expire in <b>5 minutes</b>.</p>
              <p style="font-size:13px; color:#64748b; margin-top:25px;">
                If you did not request this code, please ignore this email.
              </p>
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
  app.post("/verify-otp", async (req, res) => {
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

      let attemptData = await OtpAttempt.findOne({
        email: cleanEmail,
      });

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
          message: `Invalid OTP. ${
            5 - attemptData.failedAttempts
          } attempt(s) left.`,
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
      console.error("VERIFY OTP ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Verification failed",
        error: error.message,
      });
    }
  });

  // GET DTR MONTHS
  app.get("/dtr-months", (req, res) => {
    res.json(["January", "February", "March"]);
  });

  // GET ALL DTR RECORDS
  app.get("/employee-dtrs", async (req, res) => {
    try {
      const rows = await EmployeeDtr.find().sort({ createdAt: -1 });

      const formatted = rows.map((item) => ({
        id: item._id,
        office: item.office,
        name: item.name,
        dateReceived: item.dateReceived,
        positionTitle: item.positionTitle,
        employmentStatus: item.employmentStatus,
        date_received: item.dateReceived,
        position_title: item.positionTitle,
        employment_status: item.employmentStatus,
        dtrData: item.dtrData,
        dtr_data: item.dtrData,
      }));

      res.json(formatted);
    } catch (error) {
      console.error("FETCH DTR ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch DTR records",
        error: error.message,
      });
    }
  });

  // ADD NEW DTR RECORD
  app.post("/employee-dtrs", async (req, res) => {
    try {
      const {
        office,
        name,
        dateReceived,
        positionTitle,
        employmentStatus,
        dtrData,
      } = req.body;

      const record = await EmployeeDtr.create({
        office: office || "",
        name: name || "",
        dateReceived: dateReceived || "",
        positionTitle: positionTitle || "",
        employmentStatus: employmentStatus || "",
        dtrData: dtrData || {},
      });

      res.json({
        success: true,
        message: "DTR record saved successfully",
        id: record._id,
      });
    } catch (error) {
      console.error("SAVE DTR ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to save DTR record",
        error: error.message,
      });
    }
  });

  // UPDATE DTR RECORD
  app.put("/employee-dtrs/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const {
        office,
        name,
        dateReceived,
        positionTitle,
        employmentStatus,
        dtrData,
      } = req.body;

      const updated = await EmployeeDtr.findByIdAndUpdate(
        id,
        {
          office: office || "",
          name: name || "",
          dateReceived: dateReceived || "",
          positionTitle: positionTitle || "",
          employmentStatus: employmentStatus || "",
          dtrData: dtrData || {},
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "DTR record not found",
        });
      }

      res.json({
        success: true,
        message: "DTR record updated successfully",
        id: updated._id,
      });
    } catch (error) {
      console.error("UPDATE DTR ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update DTR record",
        error: error.message,
      });
    }
  });

  // DELETE DTR RECORD
  app.delete("/employee-dtrs/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await EmployeeDtr.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "DTR record not found",
        });
      }

      res.json({
        success: true,
        message: "DTR record deleted successfully",
      });
    } catch (error) {
      console.error("DELETE DTR ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete DTR record",
        error: error.message,
      });
    }
  });

  // GET AUDIT LOGS
  app.get("/audit-logs", async (req, res) => {
    try {
      const logs = await AuditLog.find().sort({ createdAt: -1 });

      res.json(logs);
    } catch (error) {
      console.error("FETCH AUDIT LOGS ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch audit logs",
        error: error.message,
      });
    }
  });

  // ADD AUDIT LOG
  app.post("/audit-logs", async (req, res) => {
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
      console.error("SAVE AUDIT LOG ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to save audit log",
        error: error.message,
      });
    }
  });

  // GET LEAVE REQUESTS
  app.get("/leave-requests", async (req, res) => {
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

  // ADD LEAVE REQUEST
  app.post("/leave-requests", async (req, res) => {
  try {
    const {
      employee,
      leaveType,
      date,
      reason,
      status,
    } = req.body;

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

  // UPDATE LEAVE REQUEST STATUS
  app.put("/leave-requests/:id", async (req, res) => {
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

  // TEST USERS
  app.get("/test-users", async (req, res) => {
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

  // GET MY DTR BY EMPLOYEE NAME
  app.get("/my-dtr/:name", async (req, res) => {
    try {
      const employeeName = req.params.name;

      const record = await EmployeeDtr.findOne({
        name: { $regex: new RegExp(`^${employeeName}$`, "i") },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "No DTR record found",
        });
      }

      res.json({
        success: true,
        dtr: record,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch DTR",
        error: error.message,
      });
    }
  });
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

app.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

app.post("/announcements", async (req, res) => {
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

// UPDATE ANNOUNCEMENT
app.put("/announcements", async (req, res) => {
  try {
    const { id, title, message } = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        title,
        message,
      },
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

// DELETE ANNOUNCEMENT
app.delete("/announcements/:id", async (req, res) => {
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
// update profile
app.put("/update-profile", async (req, res) => {
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
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});
  // START SERVER
  
  app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
  });