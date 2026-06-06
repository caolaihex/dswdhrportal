import mongoose from "mongoose";

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

const EmployeeDtr = mongoose.model(
  "EmployeeDtr",
  employeeDtrSchema
);

export default EmployeeDtr;