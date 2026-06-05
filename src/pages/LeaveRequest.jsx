import "./leaveRequest.css";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function LeaveRequest() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/leave-requests");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch leave requests");
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Leave requests error:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const addAuditLog = async (action, type = "activity") => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user")) || {};

      await fetch("http://localhost:5000/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: currentUser.name || "Unknown User",
          role: currentUser.role || "NO ROLE",
          action,
          type,
          date: new Date().toLocaleString("en-PH", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        }),
      });
    } catch (error) {
      console.error("Audit log error:", error);
    }
  };

  const handleStatusChange = async (id, newStatus, employeeName) => {
    try {
      const res = await fetch(`http://localhost:5000/leave-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update leave status");
      }

      setRequests((prev) =>
        prev.map((req) =>
          (req._id || req.id) === id ? { ...req, status: newStatus } : req
        )
      );

      await addAuditLog(
        `${newStatus} leave request of ${employeeName}`,
        newStatus === "Approved" ? "approved" : "edit"
      );
    } catch (error) {
      console.error("Update leave status error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="leave-page">
      <div className="leave-topbar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={20} />
        </button>

        <div className="leave-title">
          <h1>Leave Requests</h1>
          <span>Manage and review employee leave applications</span>
        </div>
      </div>

      <div className="leave-card">
        <div className="leave-table-header">
          <h2>Employee Leave Requests</h2>
          <span>{requests.length} requests</span>
        </div>

        {loading ? (
          <p>Loading leave requests...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="5">No leave requests found.</td>
                </tr>
              ) : (
                requests.map((request) => {
                  const id = request._id || request.id;

                  return (
                    <tr key={id}>
                      <td>{request.employee}</td>
                      <td>{request.leaveType}</td>
                      <td>{request.date}</td>
                      <td>{request.reason || "No reason stated"}</td>

                      <td>
                        <select
                          className={`status-select ${String(
                            request.status || "Pending"
                          ).toLowerCase()}`}
                          value={request.status || "Pending"}
                          disabled={request.status !== "Pending"}
                          onChange={(e) =>
                            handleStatusChange(
                              id,
                              e.target.value,
                              request.employee
                            )
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default LeaveRequest;