import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./myDTR.css";

function MyDTR() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const fallbackMonths = ["January", "February", "March", "April"];

  const getSavedMonths = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("dtrMonths"));
      return Array.isArray(saved) && saved.length > 0 ? saved : fallbackMonths;
    } catch {
      return fallbackMonths;
    }
  };

  const [months, setMonths] = useState(getSavedMonths);
  const [myDtr, setMyDtr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingMonth, setSubmittingMonth] = useState("");

  const fullName =
    user.name ||
    `${user.firstName || user.first_name || ""} ${
      user.lastName || user.last_name || ""
    }`.trim();

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    return date.toLocaleDateString("en-PH", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchMyDtr = async () => {
    try {
      setLoading(true);

      let savedMonths = getSavedMonths();

      const response = await fetch(
        `http://localhost:5000/my-dtr/${encodeURIComponent(fullName)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMyDtr(null);
        return;
      }

      const record = data.dtr;
      const existingDtrData = record.dtrData || record.dtr_data || {};

      const monthsFromDatabase = Object.keys(existingDtrData || {});

      savedMonths = Array.from(
        new Set([...savedMonths, ...monthsFromDatabase])
      );

      setMonths(savedMonths);

      const fixedDtrData = {};

      savedMonths.forEach((month) => {
        const savedMonth = existingDtrData[month] || {};

        fixedDtrData[month] = {
          remarks: savedMonth.remarks || savedMonth.status || "Pending",
          status: savedMonth.status || savedMonth.remarks || "Pending",
          dtrs: savedMonth.dtrs || savedMonth.remark || "No DTR",
          remark: savedMonth.remark || savedMonth.dtrs || "No DTR",
          date: savedMonth.date || "",
          submittedAt: savedMonth.submittedAt || "",
        };
      });

      setMyDtr({
        ...record,
        dtrData: fixedDtrData,
      });
    } catch (error) {
      console.error("FETCH MY DTR ERROR:", error);
      setMyDtr(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDtr();
  }, []);

  const handleDateChange = (month, date) => {
    if (!myDtr) return;

    const currentDtrData = myDtr.dtrData || {};
    const currentMonthData = currentDtrData[month] || {};

    setMyDtr({
      ...myDtr,
      dtrData: {
        ...currentDtrData,
        [month]: {
          ...currentMonthData,
          date,
        },
      },
    });
  };

  const handleSubmitDTR = async (month) => {
    if (!myDtr) return;

    const currentDtrData = myDtr.dtrData || {};
    const currentMonthData = currentDtrData[month] || {};

    if (!currentMonthData.date) {
      alert("Please select a date before submitting.");
      return;
    }

    if (currentMonthData.status?.toLowerCase() === "approved") {
      alert("This month is already approved.");
      return;
    }

    const submittedDate = formatDate(currentMonthData.date);
    const submittedText = `Submitted on ${submittedDate}`;

    const updatedDtrData = {
      ...currentDtrData,
      [month]: {
        ...currentMonthData,
        remarks: "Pending",
        status: "Pending",
        dtrs: submittedText,
        remark: submittedText,
        date: currentMonthData.date,
        submittedAt: new Date().toISOString(),
      },
    };

    setSubmittingMonth(month);

    try {
      const response = await fetch(
        `http://localhost:5000/employee-dtrs/${myDtr.id || myDtr._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            office: myDtr.office || "",
            name: myDtr.name || fullName,
            dateReceived: myDtr.dateReceived || "",
            positionTitle: myDtr.positionTitle || myDtr.position_title || "",
            employmentStatus:
              myDtr.employmentStatus || myDtr.employment_status || "Employee",
            dtrData: updatedDtrData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to submit DTR.");
        return;
      }

      alert(`${month} DTR submitted successfully!`);
      fetchMyDtr();
    } catch (error) {
      console.error("SUBMIT DTR ERROR:", error);
      alert("Server error while submitting DTR.");
    } finally {
      setSubmittingMonth("");
    }
  };

  return (
    <div className="mydtr-page">
      <button
        className="mydtr-back-btn"
        onClick={() => navigate("/employee-dashboard")}
      >
        <ArrowLeft size={18} />
     
      </button>

      <div className="mydtr-header">
        <FileText size={42} />
        <h1>My DTR</h1>
        <p>View and submit your own monthly DTR record.</p>
      </div>

      {loading ? (
        <div className="mydtr-empty">Loading...</div>
      ) : !myDtr ? (
        <div className="mydtr-empty">
          No DTR record found for your account. Please contact HR.
        </div>
      ) : (
        <div className="mydtr-card">
          <div className="mydtr-info">
            <div>
              <h2>{myDtr.name}</h2>
              <p>{myDtr.positionTitle || myDtr.position_title || "Employee"}</p>
            </div>

            <span>{myDtr.employmentStatus || myDtr.employment_status}</span>
          </div>

          <table className="mydtr-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Status</th>
                <th>Remark</th>
                <th>Select Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {months.map((month) => {
                const value = myDtr.dtrData?.[month] || {};

                const status =
                  value.dtrs === "No DTR" || value.remark === "No DTR"
                    ? "Not Submitted"
                    : value.remarks || value.status || "Pending";

                const remark = value.dtrs || value.remark || "No DTR";

                return (
                  <tr key={month}>
                    <td>{month}</td>

                    <td>
                      <span
                        className={`mydtr-badge ${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td>{remark}</td>

                    <td>
                      <input
                        type="date"
                        className="dtr-date-input"
                        value={value.date || ""}
                        disabled={status.toLowerCase() === "approved"}
                        onChange={(e) => handleDateChange(month, e.target.value)}
                      />
                    </td>

                    <td>
                      <button
                        className="submit-dtr-btn"
                        onClick={() => handleSubmitDTR(month)}
                        disabled={
                          submittingMonth === month ||
                          status.toLowerCase() === "approved"
                        }
                      >
                        <Send size={16} />
                        {submittingMonth === month
                          ? "Submitting..."
                          : status.toLowerCase() === "approved"
                          ? "Approved"
                          : `Submit ${month}`}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyDTR;