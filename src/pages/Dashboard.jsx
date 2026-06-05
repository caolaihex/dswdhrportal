import { useEffect, useState } from "react";
import "./dashboard.css";
import logo from "../assets/dswd.png";

import {
  Home,
  Users,
  ClipboardList,
  Clock,
  LogOut,
  User,
  ChevronDown,
  FileText,
  CheckCircle,
  CalendarDays,
  Megaphone,
  Activity,
} from "lucide-react";
import { getProfile } from "../api/auth";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const defaultMonths = ["January", "February", "March"];

  const [currentTime, setCurrentTime] = useState("");
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingDtrs, setPendingDtrs] = useState(0);
  const [approvedDtrs, setApprovedDtrs] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const [announcementForm, setAnnouncementForm] = useState({
    id: null,
    title: "",
    message: "",
  });

  const getLoggedUser = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user")) || {};

      const firstName =
        savedUser.firstName ||
        savedUser.first_name ||
        savedUser.firstname ||
        savedUser.fname ||
        "";

      const lastName =
        savedUser.lastName ||
        savedUser.last_name ||
        savedUser.lastname ||
        savedUser.lname ||
        "";

      const generatedName = `${firstName} ${lastName}`.trim();

      return {
        ...savedUser,
        name: savedUser.name || generatedName || "No Name",
        role: savedUser.role || "NO ROLE",
      };
    } catch {
      return {
        name: "No Name",
        role: "NO ROLE",
      };
    }
  };

 const [user, setUser] = useState(getLoggedUser());

useEffect(() => {
  const loadProfile = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user")) || {};
    const userId = savedUser.id || savedUser._id;

    if (!userId) return;

    const result = await getProfile(userId);

    if (result.ok && result.data?.user) {
      const updatedUser = {
        ...savedUser,
        ...result.data.user,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  loadProfile();
}, [])


  const userRole = String(user.role || "").toLowerCase();
  const isHRManager = userRole === "hr_manager" || userRole === "hr manager";

  const addAuditLog = async (action, type = "activity") => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user")) || {};

      const fullName = currentUser.name || "Unknown User";

      await fetch("http://localhost:5000/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: fullName,
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

      fetchActivities();
    } catch (error) {
      console.error("Audit log error:", error);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleString("en-PH", {
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

  useEffect(() => {
    fetchEmployees();
    fetchAnnouncements();
    fetchActivities();

    const refreshDashboard = () => {
      fetchEmployees();
      fetchAnnouncements();
      fetchActivities();
    };

    window.addEventListener("focus", refreshDashboard);

    return () => {
      window.removeEventListener("focus", refreshDashboard);
    };
  }, []);

  const safeJson = async (response) => {
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      console.error("Response is not JSON:", text);
      return null;
    }
  };

  const safeParseDtrData = (employee) => {
    try {
      if (typeof employee.dtr_data === "string") {
        return JSON.parse(employee.dtr_data || "{}");
      }

      if (employee.dtr_data) return employee.dtr_data;
      if (employee.dtrData) return employee.dtrData;

      return {};
    } catch {
      return {};
    }
  };

  const fetchEmployees = async () => {
    try {
      const [employeesResponse, monthsResponse] = await Promise.all([
        fetch("http://localhost:5000/employee-dtrs"),
        fetch("http://localhost:5000/dtr-months"),
      ]);

      const data = await safeJson(employeesResponse);
      const monthsData = await safeJson(monthsResponse);

      const employees = Array.isArray(data) ? data : [];

      const months =
        Array.isArray(monthsData) && monthsData.length > 0
          ? monthsData
          : defaultMonths;

      const pendingCount = employees.reduce((count, employee) => {
        const dtrData = safeParseDtrData(employee);

        return (
          count +
          Object.values(dtrData).filter((item) => {
            const status = item?.remarks || item?.status || "Pending";
            return status === "Pending";
          }).length
        );
      }, 0);

      const approvedCount = employees.reduce((count, employee) => {
        const dtrData = safeParseDtrData(employee);

        return (
          count +
          Object.values(dtrData).filter((item) => {
            const status = item?.remarks || item?.status || "Pending";
            return status === "Approved";
          }).length
        );
      }, 0);

      setTotalEmployees(employees.length);
      setPendingDtrs(pendingCount);
      setApprovedDtrs(approvedCount);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);

      setTotalEmployees(0);
      setPendingDtrs(0);
      setApprovedDtrs(0);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("http://localhost:5000/announcements");
      const data = await response.json();

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      setAnnouncements([]);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch("http://localhost:5000/audit-logs");
      const data = await response.json();

      if (Array.isArray(data)) {
        setActivities(data.slice(0, 5));
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setActivities([]);
    }
  };

  const handleLogout = () => {
    addAuditLog("Logged out", "activity");
    localStorage.removeItem("user");
    navigate("/");
  };

  const openCreateAnnouncement = () => {
    setAnnouncementForm({
      id: null,
      title: "",
      message: "",
    });

    setShowAnnouncementModal(true);
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert("Please complete all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/announcements", {
        method: announcementForm.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: announcementForm.id,
          title: announcementForm.title.trim(),
          message: announcementForm.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save announcement");
      }

      await fetchAnnouncements();

      addAuditLog(
        announcementForm.id
          ? "Edited an announcement"
          : "Created an announcement",
        announcementForm.id ? "edit" : "add"
      );

      setAnnouncementForm({
        id: null,
        title: "",
        message: "",
      });

      setShowAnnouncementModal(false);
    } catch (error) {
      console.error("Announcement save error:", error);
      alert("Failed to save announcement.");
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setAnnouncementForm({
      id: announcement._id,
      title: announcement.title,
      message: announcement.message,
    });

    setShowAnnouncementModal(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    const confirmDelete = window.confirm("Delete this announcement?");

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/announcements/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete announcement");
      }

      await fetchAnnouncements();

      addAuditLog("Deleted an announcement", "delete");
    } catch (error) {
      console.error("Announcement delete error:", error);
      alert("Failed to delete announcement.");
    }
  };

  const getDotColor = (type = "") => {
    const lowerType = String(type).toLowerCase();

    if (lowerType.includes("delete") || lowerType.includes("decline")) {
      return "red";
    }

    if (lowerType.includes("edit") || lowerType.includes("pending")) {
      return "yellow";
    }

    if (lowerType.includes("add") || lowerType.includes("approve")) {
      return "green";
    }

    return "blue";
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="DSWD" />
          <h1>DSWD</h1>
        </div>

        <h2>HR PORTAL</h2>

        <nav>
          <a className="active" onClick={() => navigate("/dashboard")}>
            <Home size={20} /> Dashboard
          </a>

          <a onClick={() => navigate("/employees")}>
            <Users size={20} /> Employees
          </a>

          <a onClick={() => navigate("/leave-requests")}>
            <CalendarDays size={20} /> Leave Requests
          </a>

          <a onClick={() => navigate("/audit-logs")}>
            <ClipboardList size={20} /> Audit Logs
          </a>

          
          <a onClick={() => navigate("/profile-settings")}>
            <User size={20} /> Profile Settings
          </a>
        
        </nav>
      
        <div className="profile">
          <div className="avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" />
            ) : (
              <User size={20} />
            )}
          </div>

          <div>
            <b>{user.name}</b>
            <p>{String(user.role || "NO ROLE").toUpperCase()}</p>
          </div>

          <ChevronDown size={18} />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div></div>

          <div className="top-actions">
            <span>
              <Clock size={18} /> {currentTime}
            </span>

            <button onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="welcome-card">
            <div>
              <p>Welcome back,</p>

              <h1>{user.name}</h1>

              <span>
                Here is the overview of employee records, DTR status, leave
                requests, announcements, and recent activities.
              </span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <Users size={24} />
              </div>

              <div>
                <p>Total Employees</p>
                <h2>{totalEmployees}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow">
                <FileText size={24} />
              </div>

              <div>
                <p>Pending DTRs</p>
                <h2>{pendingDtrs}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <CheckCircle size={24} />
              </div>

              <div>
                <p>Approved DTRs</p>
                <h2>{approvedDtrs}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <CalendarDays size={24} />
              </div>

              <div>
                <p>Leave Requests</p>
                <h2>2</h2>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="panel">
              <div className="panel-header panel-flex">
                <h2>
                  <Megaphone size={20} /> Announcements
                </h2>

                {isHRManager && (
                  <button
                    type="button"
                    className="announcement-btn"
                    onClick={openCreateAnnouncement}
                  >
                    Create
                  </button>
                )}
              </div>

              <div className="announcement-list">
                {announcements.length === 0 ? (
                  <p>No announcements yet.</p>
                ) : (
                  announcements.map((item) => (
                    <div className="announcement-item" key={item._id}>
                      <div className="announcement-top">
                        <b>{item.title}</b>

                        {isHRManager && (
                          <div className="announcement-actions">
                            <button
                              type="button"
                              className="edit-ann-btn"
                              onClick={() => handleEditAnnouncement(item)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-ann-btn"
                              onClick={() => handleDeleteAnnouncement(item._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <p>{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>
                  <Activity size={20} /> Recent Activity Logs
                </h2>
              </div>

              <div className="activity-list">
                {activities.length === 0 ? (
                  <p>No recent activities.</p>
                ) : (
                  activities.map((log) => (
                    <div className="activity-item" key={log._id}>
                      <span className={`dot ${getDotColor(log.type)}`}></span>

                      <div>
                        <b>{log.action || "Activity"}</b>

                        <p>
                          {log.user || "Unknown User"} •{" "}
                          {log.date ||
                            new Date(log.createdAt).toLocaleString("en-PH", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {showAnnouncementModal && (
          <div className="announcement-modal-overlay">
            <div className="announcement-modal">
              <h2>
                {announcementForm.id
                  ? "Edit Announcement"
                  : "Create Announcement"}
              </h2>

              <input
                type="text"
                placeholder="Announcement title"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    title: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Announcement message"
                rows="5"
                value={announcementForm.message}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    message: e.target.value,
                  })
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAnnouncementModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="save-ann-btn"
                  onClick={handleSaveAnnouncement}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;