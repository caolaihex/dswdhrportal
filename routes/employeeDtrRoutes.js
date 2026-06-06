import express from "express";
import EmployeeDtr from "../models/EmployeeDTR.js";

const router = express.Router();

// GET DTR MONTHS
router.get("/dtr-months", (req, res) => {
  res.json(["January", "February", "March"]);
});

// GET ALL DTR RECORDS
router.get("/employee-dtrs", async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch DTR records",
      error: error.message,
    });
  }
});

// ADD DTR
router.post("/employee-dtrs", async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Failed to save DTR record",
      error: error.message,
    });
  }
});

// UPDATE DTR
router.put("/employee-dtrs/:id", async (req, res) => {
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
        office,
        name,
        dateReceived,
        positionTitle,
        employmentStatus,
        dtrData,
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
    res.status(500).json({
      success: false,
      message: "Failed to update DTR record",
      error: error.message,
    });
  }
});

// DELETE DTR
router.delete("/employee-dtrs/:id", async (req, res) => {
  try {
    const deleted = await EmployeeDtr.findByIdAndDelete(req.params.id);

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
    res.status(500).json({
      success: false,
      message: "Failed to delete DTR record",
      error: error.message,
    });
  }
});

// MY DTR
router.get("/my-dtr/:name", async (req, res) => {
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

export default router;