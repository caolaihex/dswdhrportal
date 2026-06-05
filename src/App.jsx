import "./App.css";
import logo from "./assets/dswd.png";

import {
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";

import { useState, useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import LeaveRequests from "./pages/LeaveRequest";
import AuditLogs from "./pages/AuditLogs";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeLeaveRequest from "./pages/EmployeeLeaveRequest";
import ProfileSettings from "./pages/ProfileSettings";
import MyDTR from "./pages/MyDTR";
import { loginUser, sendOtp, verifyOtp } from "./api/auth";

// PROTECTED ROUTE
function ProtectedRoute({ allowedRoles, children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const role = String(user.originalRole || user.role || "")
    .toLowerCase()
    .replaceAll(" ", "_");

  if (!allowedRoles.includes(role)) {
    if (role === "employee" || role === "viewer") {
      return <Navigate to="/employee-dashboard" replace />;
    }

    if (role === "hr_manager" || role === "hr_clerk") {
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRoleNavigation = (role) => {
  if (role === "hr_manager" || role === "hr_clerk") {
    navigate("/dashboard", { replace: true });
  } else if (role === "employee") {
    navigate("/employees", { replace: true });
  } else {
    alert("Unknown role: " + role);
  }
};

  const getFullName = (user) => {
    const firstName =
      user.firstName ||
      user.first_name ||
      user.firstname ||
      user.fname ||
      "";

    const lastName =
      user.lastName ||
      user.last_name ||
      user.lastname ||
      user.lname ||
      "";

    return `${firstName} ${lastName}`.trim() || user.name || "HR User";
  };

  const saveUserAndNavigate = (loggedUser) => {
    const originalRole = (loggedUser.role || "")
      .toLowerCase()
      .replaceAll(" ", "_");

    const savedUser = {
      id: loggedUser._id || loggedUser.id || "",
      email: loggedUser.email || "",
      name: getFullName(loggedUser),

      firstName:
        loggedUser.firstName ||
        loggedUser.first_name ||
        "",

      lastName:
        loggedUser.lastName ||
        loggedUser.last_name ||
        "",

      role: originalRole.replaceAll("_", " ").toUpperCase(),
      originalRole,
    };

    localStorage.setItem("user", JSON.stringify(savedUser));

    handleRoleNavigation(originalRole);
  };

  const resetLoginForm = () => {
    setEmail("");
    setPassword("");
    setOtp("");
    setShowOtp(false);
    setPendingUser(null);
    setLoading(false);

    localStorage.removeItem("user");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading || showOtp) return;

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const result = await loginUser(cleanEmail, password);

      if (!result.ok) {
        alert(result.data?.message || "Login failed");
        return;
      }

      const loggedUser = result.data?.user || result.data;

      const otpResult = await sendOtp(cleanEmail);

      if (!otpResult.ok) {
        alert(otpResult.data?.message || "Failed to send OTP");
        return;
      }

      setPendingUser(loggedUser);
      setShowOtp(true);
      setOtp("");

      alert("OTP sent to your email.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const result = await verifyOtp(cleanEmail, otp);

      if (!result.ok) {
        alert(result.data?.message || "Invalid OTP");
        return;
      }

      if (!pendingUser) {
        alert("Session expired. Please log in again.");

        resetLoginForm();

        return;
      }

      saveUserAndNavigate(pendingUser);
    } catch (error) {
      console.error(error);
      alert("OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="left-panel">
        <img src={logo} alt="DSWD Logo" className="logo" />

        <h1>DSWD</h1>

        <h3>
          Department of Social Welfare and Development
        </h3>

        <div className="line"></div>

        <h2>HR PORTAL</h2>

        <p>
          Empowering our people. Strengthening service.
          Building a better future for every Filipino.
        </p>
      </div>

      <div className="right-panel">
        <div className="login-card">
          <h2>
            {showOtp
              ? "Verify OTP"
              : "Welcome to DSWD HR Portal"}
          </h2>

          {!showOtp ? (
            <form onSubmit={handleLogin}>
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <button type="submit" disabled={loading}>
                {loading
                  ? "Sending OTP..."
                  : "Log In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <p className="otp-message">
                OTP was sent to <b>{email}</b>
              </p>

              <label>OTP Code</label>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
                maxLength="6"
                required
              />

              <button type="submit" disabled={loading}>
                {loading
                  ? "Verifying..."
                  : "Verify OTP"}
              </button>

              <button
                type="button"
                className="back-login-btn"
                disabled={loading}
                onClick={resetLoginForm}
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function AutoLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const logout = () => {
      localStorage.removeItem("user");

      alert(
        "You have been logged out due to inactivity."
      );

      navigate("/");
    };

    const resetTimer = () => {
      clearTimeout(timer);

      const user = localStorage.getItem("user");

      if (user) {
        timer = setTimeout(
          logout,
          5 * 60 * 1000
        );
      }
    };

    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);

      events.forEach((event) => {
        window.removeEventListener(
          event,
          resetTimer
        );
      });
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <>
      <AutoLogout />

      <Routes>
        <Route path="/" element={<Login />} />
        {/* EMPLOYEE DASHBOARD */}

        
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["employee"]}
            >
              <EmployeeDashboard />
            </ProtectedRoute>
          }
          />
                  <Route
  path="/my-dtr"
  element={
    <ProtectedRoute allowedRoles={["employee", "viewer"]}>
      <MyDTR />
    </ProtectedRoute>
  }
/>

                  <Route
  path="/profile-settings"
  element={
    <ProtectedRoute allowedRoles={["employee","hr_manager", "hr_clerk"]}>
      <ProfileSettings />
    </ProtectedRoute>
  }
/>
        <Route
        path="/employee-leave-request"
        element={
        <ProtectedRoute allowedRoles={["employee"]}>
        <EmployeeLeaveRequest />
      </ProtectedRoute>
      }
        />
        {/* HR MANAGER + HR CLERK */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "hr_manager",
                "hr_clerk",
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* HR MANAGER + HR CLERK */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute
              allowedRoles={[
                "hr_manager",
                "hr_clerk",
              ]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />

        {/* HR MANAGER + HR CLERK */}
        <Route
          path="/leave-requests"
          element={
            <ProtectedRoute
              allowedRoles={[
                "hr_manager",
                "hr_clerk",
              ]}
            >
              <LeaveRequests />
            </ProtectedRoute>
          }
        />

        {/* HR MANAGER + HR CLERK */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute
              allowedRoles={[
                "hr_manager",
                "hr_clerk",
              ]}
            >
              <AuditLogs />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;