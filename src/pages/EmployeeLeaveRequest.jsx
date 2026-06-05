import { useEffect, useState } from "react";
import "./employeeLeaveRequest.css";
import logo from "../assets/dswd.png";

import {
  Home,
  CalendarDays,
  Clock,
  LogOut,
  User,
  ChevronDown,
  FileText,
  Bell,
  Send,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function EmployeeLeaveRequest() {
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Employee",
    role: "employee",
  };

  const fetchMyLeaveRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/leave-requests");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch leave requests.");
      }

      const myRequests = Array.isArray(data)
        ? data.filter((request) => request.employee === user.name)
        : [];

      setRequests(myRequests.reverse());
    } catch (error) {
      console.error("Fetch my leave requests error:", error);
    }
  };

  useEffect(() => {
    fetchMyLeaveRequests();

    const interval = setInterval(fetchMyLeaveRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const submitLeaveRequest = async (e) => {
    e.preventDefault();

    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason) {
      alert("Please complete all fields.");
      return;
    }

    const newRequest = {
      employee: user.name || "Employee",
      leaveType: form.leaveType,
      date: `${form.startDate} to ${form.endDate}`,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      status: "Pending",
      dateSubmitted: new Date().toLocaleString("en-PH"),
    };

    try {
      setSubmitting(true);

      const res = await fetch("http://localhost:5000/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRequest),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit leave request.");
      }

      await fetchMyLeaveRequests();

      setForm({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      alert("Leave request submitted.");
    } catch (error) {
      console.error("Submit leave request error:", error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-leave-page">
      <aside className="employee-leave-sidebar">
        <div className="employee-leave-brand">
          <img src={logo} alt="DSWD" />
          <h1>DSWD</h1>
        </div>


        <nav>
          <a onClick={() => navigate("/employee-dashboard")}>
            <Home size={20} /> Dashboard
          </a>

          <a>
            <FileText size={20} /> My DTR
          </a>

          <a className="active">
            <CalendarDays size={20} /> Leave Requests
          </a>
<a onClick={() => navigate("/profile-settings")}>
          <User size={20} /> Profile Settings
          </a>
         
        </nav>

        <div className="employee-profile">
          <div className="employee-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" />
            ) : (
              <User size={20} />
            )}
          </div>

          <div>
            <b>{user.name}</b>
            <p>{String(user.role).toUpperCase()}</p>
          </div>

          <ChevronDown size={18} />
        </div>
      </aside>

      <main className="employee-leave-main">
        <header className="employee-leave-topbar">
          <div className="employee-leave-top-actions">
            <span>
              <Clock size={18} />
              {currentTime}
            </span>

            <button onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        <section className="employee-leave-content">
          <div className="employee-leave-welcome">
            <div>
              <h1>Submit Leave Request</h1>
              <span>
                Fill out the form below to submit your leave request for HR review.
              </span>
            </div>
          </div>

          <div className="employee-leave-grid">
            <div className="employee-leave-card">
              <h2>
                <Send size={20} />
                Request Form
              </h2>

              <form onSubmit={submitLeaveRequest}>
                <label>Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) =>
                    setForm({ ...form, leaveType: e.target.value })
                  }
                >
                  <option value="">Select leave type</option>
                  <option value="Vacation Leave">Vacation Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                  <option value="Paternity Leave">Paternity Leave</option>
                </select>

                <label>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />

                <label>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />

                <label>Reason</label>
                <textarea
                  rows="5"
                  placeholder="Enter reason for leave"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                />

                <button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>

            <div className="employee-leave-card">
              <h2>
                <CalendarDays size={20} />
                My Leave Requests
              </h2>

              <div className="employee-leave-list">
                {requests.length === 0 ? (
                  <p className="empty-leave">No leave requests yet.</p>
                ) : (
                  requests.map((request) => (
                    <div
                      className="employee-leave-item"
                      key={request._id || request.id}
                    >
                      <div>
                        <b>{request.leaveType}</b>
                        <p>
                          {request.startDate} to {request.endDate}
                        </p>
                        <small>{request.reason}</small>
                      </div>

                      <span
                      className={`leave-status ${String(
                       request.status || "Pending"
                      ).toLowerCase()}`}
                      >
                      {request.status || "Pending"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EmployeeLeaveRequest;