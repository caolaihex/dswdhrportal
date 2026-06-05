import { useEffect, useState } from "react";
import "./employeeDashboard.css";
import logo from "../assets/dswd.png";

import {
  Home,
  CalendarDays,
  Clock,
  LogOut,
  User,
  ChevronDown,
  Megaphone,
  FileText,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/auth";

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState("");

  const defaultAnnouncements = [
    {
      id: 1,
      title: "Payroll Reminder",
      message: "Payroll release will be available on Friday at 3:00 PM.",
    },
    {
      id: 2,
      title: "Office Advisory",
      message: "Please wear your official ID inside the office premises.",
    },
  ];

  const [announcements, setAnnouncements] = useState([]);

useEffect(() => {
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("http://localhost:5000/announcements");
      const data = await res.json();

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      setAnnouncements([]);
    }
  };

  fetchAnnouncements();
}, []);

  const getLoggedUser = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user")) || {};

      const firstName = savedUser.firstName || savedUser.first_name || "";
      const lastName = savedUser.lastName || savedUser.last_name || "";

      return {
        ...savedUser,
        name: `${firstName} ${lastName}`.trim() || savedUser.name || "Employee",
        role: savedUser.role || "viewer",
        profileImage: savedUser.profileImage || "",
      };
    } catch {
      return {
        name: "Employee",
        role: "viewer",
        profileImage: "",
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
        localStorage.setItem("user", JSON.stringify(result.data.user));
        setUser(result.data.user);
      }
    };

    loadProfile();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="employee-dashboard">
      <aside className="employee-sidebar">
        <div className="employee-brand">
          <img src={logo} alt="DSWD" />
          <h1>DSWD</h1>
        </div>

        <nav>
          <a className="active">
            <Home size={20} /> Dashboard
          </a>

          <a onClick={() => navigate("/my-dtr")}>
            <FileText size={20} /> My DTR
          </a>

          <a onClick={() => navigate("/employee-leave-request")}>
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
            <b>{user.name || "Employee"}</b>
            <p>{String(user.role || "viewer").toUpperCase()}</p>
          </div>

          <ChevronDown size={18} />
        </div>
      </aside>

      <main className="employee-main">
        <header className="employee-topbar">
          <div className="employee-top-actions">
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

        <section className="employee-content">
          <div className="employee-welcome-card">
            <div>
              <p>Welcome back,</p>
              <h1>{user.name || "Employee"}</h1>
              <span>
                View your attendance records, announcements, and employee
                information here.
              </span>
            </div>
          </div>

          <div className="employee-grid">
            <div className="employee-panel">
              <h2>
                <Megaphone size={20} />
                Announcements
              </h2>

              <div className="employee-announcement-list">
                {announcements.map((item) => (
                  <div className="employee-announcement-item" key={item.id}>
                    <b>{item.title}</b>
                    <p>{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EmployeeDashboard;