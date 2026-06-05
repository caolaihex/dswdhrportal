import "./submitDTR.css";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function SubmitDTR() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    employeeName: "",
    month: "",
    remarks: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("DTR submitted successfully!");
    console.log(formData);
  };

  return (
    <div className="submit-dtr-page">
      <div className="submit-dtr-topbar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={20} />
        </button>

        <div>
          <p>HR MANAGEMENT</p>
          <h1>Submit DTR</h1>
        </div>
      </div>

      <div className="submit-dtr-card">
        <div className="submit-dtr-header">
          <Upload size={30} />
          <div>
            <h2>Daily Time Record Submission</h2>
            <p>Upload your monthly DTR for HR review.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="submit-dtr-form">
          <label>
            Employee Name
            <input
              type="text"
              name="employeeName"
              placeholder="Enter employee name"
              value={formData.employeeName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Month
            <input
              type="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Upload DTR File
            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Remarks
            <textarea
              name="remarks"
              placeholder="Add remarks here..."
              value={formData.remarks}
              onChange={handleChange}
            ></textarea>
          </label>

          <button type="submit" className="submit-btn">
            Submit DTR
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitDTR;