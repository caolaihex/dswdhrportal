import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  User,
  FileEdit,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import "./auditLogs.css";

function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/audit-logs");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch audit logs");
      }

      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Audit logs error:", error);
      setLogs([]);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "approved":
        return <CheckCircle size={18} />;
      case "add":
        return <User size={18} />;
      case "edit":
        return <FileEdit size={18} />;
      case "delete":
        return <Trash2 size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  return (
    <div className="audit-page">
      <div className="audit-topbar">
        <button className="audit-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>

        <div className="audit-title">
          <h1>Audit Logs</h1>
          <p>Track system activities and employee actions</p>
        </div>
      </div>

      

      <div className="audit-card">
        <div className="audit-header">
          <h2>Recent Activity Logs</h2>
          <span>{logs.length} activities</span>
        </div>

        <div className="audit-list">
          {logs.length === 0 ? (
            <div className="audit-empty">
              <p>No activity logs yet.</p>
            </div>
          ) : (
            logs.map((log) => (
  <div key={log._id || log.id} className="audit-item">
    <div className={`audit-icon ${log.type || "activity"}`}>
      {getIcon(log.type)}
    </div>

    <div className="audit-content">
      <h3>{log.action || "No action recorded"}</h3>

      <p>
        <strong>{log.user || "Unknown User"}</strong>{" "}
        <span>({String(log.role || "NO ROLE").toUpperCase()})</span>{" "}
        performed this action.
      </p>

      <span>
        {log.date ||
          (log.createdAt ? new Date(log.createdAt).toLocaleString() : "No date")}
      </span>
    </div>
  </div>
))
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;