import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./employees.css";

function Employees() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const currentRole = currentUser.originalRole || currentUser.role || "";

  const canEdit = currentRole === "hr_manager" || currentRole === "hr_clerk";
  const canDelete = currentRole === "hr_manager";
  const canAdd = currentRole === "hr_manager" || currentRole === "hr_clerk";

  const defaultMonths = ["January", "February", "March", "April"];

  const getSavedMonths = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("dtrMonths"));
      return Array.isArray(saved) && saved.length > 0 ? saved : defaultMonths;
    } catch {
      return defaultMonths;
    }
  };

  const createBlankRow = () => ({
    id: null,
    office: "",
    name: "",
    dateReceived: "",
    positionTitle: "",
    employmentStatus: "",
    dtrData: {},
  });

  const [months, setMonths] = useState(getSavedMonths);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [officeFilter, setOfficeFilter] = useState("All Offices");
  const [statusFilter, setStatusFilter] = useState("All Employment Status");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(createBlankRow());

  useEffect(() => {
    fetchDtrs();
  }, [months]);

  
  const addAuditLog = async (action, type = "activity") => {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const fullName =
        user.name ||
        `${user.firstName || user.first_name || ""} ${
          user.lastName || user.last_name || ""
        }`.trim() ||
        "Unknown User";

      await fetch("http://localhost:5000/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: fullName,
          role: user.role || "NO ROLE",
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

  const normalizeDtrData = (dtrData = {}) => {
    const normalized = { ...dtrData };

    months.forEach((month) => {
      const current = normalized[month] || {};
      normalized[month] = {
        remarks: current.remarks || current.status || "Pending",
        status: current.status || current.remarks || "Pending",
        dtrs: current.dtrs || current.remark || "No DTR",
        remark: current.remark || current.dtrs || "No DTR",
        date: current.date || "",
        submittedAt: current.submittedAt || "",
      };
    });

    return normalized;
  };

 const fetchDtrs = async () => {
  try {
    const res = await fetch("http://localhost:5000/employee-dtrs");
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch DTR records");

    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const allMonths = new Set();

    data.forEach((item) => {
      const rawDtrData =
        typeof item.dtr_data === "string"
          ? JSON.parse(item.dtr_data || "{}")
          : item.dtr_data || item.dtrData || {};

      Object.keys(rawDtrData).forEach((month) => {
        if (month && month !== "undefined") {
          allMonths.add(month);
        }
      });
    });

defaultMonths.forEach((month) => allMonths.add(month));
    const finalMonths = Array.from(allMonths).sort((a, b) => {
      const indexA = monthOrder.indexOf(a);
      const indexB = monthOrder.indexOf(b);

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

    setMonths(finalMonths);
    localStorage.setItem("dtrMonths", JSON.stringify(finalMonths));

    const formatted = Array.isArray(data)
      ? data.map((item) => {
          const rawDtrData =
            typeof item.dtr_data === "string"
              ? JSON.parse(item.dtr_data || "{}")
              : item.dtr_data || item.dtrData || {};

          return {
            id: item.id || item._id,
            office: item.office || "",
            name: item.name || "",
            dateReceived: item.date_received || item.dateReceived || "",
            positionTitle: item.position_title || item.positionTitle || "",
            employmentStatus:
              item.employment_status || item.employmentStatus || "",
            dtrData: normalizeDtrData(rawDtrData, finalMonths),
          };
        })
      : [];

    setEmployees(formatted);
  } catch (error) {
    console.error("Error fetching DTR records:", error);
    alert(error.message);
  }
};

  const getRemark = (emp, month) =>
    emp.dtrData?.[month]?.remarks || emp.dtrData?.[month]?.status || "Pending";

  const getDtr = (emp, month) =>
    emp.dtrData?.[month]?.dtrs || emp.dtrData?.[month]?.remark || "No DTR";

  const totalEmployees = employees.length;

  const pendingCount = employees.reduce(
    (count, emp) =>
      count + months.filter((month) => getRemark(emp, month) === "Pending").length,
    0
  );

  const approvedCount = employees.reduce(
    (count, emp) =>
      count + months.filter((month) => getRemark(emp, month) === "Approved").length,
    0
  );

  const missingCount = employees.reduce(
    (count, emp) =>
      count + months.filter((month) => getRemark(emp, month) === "Declined").length,
    0
  );

  const offices = useMemo(() => {
    const unique = employees.map((e) => e.office).filter(Boolean);
    return ["All Offices", ...new Set(unique)];
  }, [employees]);

  const employmentStatuses = useMemo(() => {
    const unique = employees.map((e) => e.employmentStatus).filter(Boolean);
    return ["All Employment Status", ...new Set(unique)];
  }, [employees]);

  const filteredEmployees = employees.filter((emp) => {
    const searchValue = searchTerm.toLowerCase();

    return (
      (emp.name.toLowerCase().includes(searchValue) ||
        emp.office.toLowerCase().includes(searchValue) ||
        emp.positionTitle.toLowerCase().includes(searchValue)) &&
      (officeFilter === "All Offices" || emp.office === officeFilter) &&
      (statusFilter === "All Employment Status" ||
        emp.employmentStatus === statusFilter)
    );
  });

  const openEditModal = (index) => {
    if (!canEdit) return alert("You are not allowed to edit records.");
    setEditingIndex(index);
    setEditingEmployee(JSON.parse(JSON.stringify(employees[index])));
    setShowEditModal(true);
  };

  const openAddEmployeeModal = () => {
    if (!canAdd) return alert("You are not allowed to add records.");
    setEditingIndex(null);
    setEditingEmployee(createBlankRow());
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingIndex(null);
    setEditingEmployee(createBlankRow());
  };

  const handleModalChange = (field, value) => {
    setEditingEmployee((prev) => ({ ...prev, [field]: value }));
  };

  const handleModalDtrChange = (month, type, value) => {
    setEditingEmployee((prev) => ({
      ...prev,
      dtrData: {
        ...prev.dtrData,
        [month]: {
          ...(prev.dtrData?.[month] || {}),
          [type]: value,
        },
      },
    }));
  };

  const saveModalRecord = async () => {
    if (!canEdit) return alert("You are not allowed to save records.");

    try {
      const cleanDtrData = normalizeDtrData(editingEmployee.dtrData || {});
      const payload = { ...editingEmployee, dtrData: cleanDtrData };

      const isExisting = Boolean(editingEmployee.id);
      const url = isExisting
        ? `http://localhost:5000/employee-dtrs/${editingEmployee.id}`
        : "http://localhost:5000/employee-dtrs";

      const res = await fetch(url, {
        method: isExisting ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save DTR record");

      addAuditLog(
        isExisting
          ? `Updated DTR record of ${editingEmployee.name}`
          : `Added employee DTR for ${editingEmployee.name}`,
        isExisting ? "edit" : "add"
      );

      await fetchDtrs();
      closeEditModal();
      alert("DTR record saved successfully!");
    } catch (error) {
      console.error("Error saving DTR:", error);
      alert(error.message);
    }
  };

  const deleteRow = async (index) => {
    if (!canDelete) return alert("Only HR Manager can delete records.");

    const employee = employees[index];
    if (!window.confirm("Are you sure you want to delete this DTR record?")) return;

    try {
      const res = await fetch(`http://localhost:5000/employee-dtrs/${employee.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete DTR record");

      addAuditLog(`Deleted DTR record of ${employee.name}`, "delete");
      setEmployees((prev) => prev.filter((_, i) => i !== index));
      alert("DTR record deleted successfully!");
    } catch (error) {
      console.error("Error deleting DTR:", error);
      alert(error.message);
    }
  };

  const addMonth = async () => {
    if (!canEdit) return alert("You are not allowed to add months.");

    const newMonth = prompt("Enter month name:");
    if (!newMonth) return;

    const formattedMonth =
      newMonth.charAt(0).toUpperCase() + newMonth.slice(1).toLowerCase();

    if (months.includes(formattedMonth)) {
      return alert("This month already exists.");
    }

    try {
      const updatedMonths = [...months, formattedMonth];
      setMonths(updatedMonths);
      localStorage.setItem("dtrMonths", JSON.stringify(updatedMonths));

      await Promise.all(
        employees.map((employee) => {
          const updatedDtrData = {
            ...(employee.dtrData || {}),
            [formattedMonth]: {
              remarks: "Pending",
              status: "Pending",
              dtrs: "No DTR",
              remark: "No DTR",
              date: "",
              submittedAt: "",
            },
          };

          return fetch(`http://localhost:5000/employee-dtrs/${employee.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              office: employee.office || "",
              name: employee.name || "",
              dateReceived: employee.dateReceived || "",
              positionTitle: employee.positionTitle || "",
              employmentStatus: employee.employmentStatus || "",
              dtrData: updatedDtrData,
            }),
          });
        })
      );

      addAuditLog(`Added DTR month: ${formattedMonth}`, "add");
      alert(`${formattedMonth} added successfully!`);
    } catch (error) {
      console.error("ADD MONTH ERROR:", error);
      alert("Failed to add month.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setOfficeFilter("All Offices");
    setStatusFilter("All Employment Status");
  };

  return (
    <div className="employees-page">
      <div className="employees-topbar">
        <button className="emp-back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={20} />
        </button>

        <div className="topbar-title">
          <h1>Employee DTR</h1>
          <span>Manage employee DTR submissions and remarks</span>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card blue">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <p>Total Employees</p>
            <h2>{totalEmployees}</h2>
            <span>Active employees</span>
          </div>
        </div>

        <div className="summary-card yellow">
          <div className="summary-icon">⏱</div>
          <div className="summary-content">
            <p>Pending DTR</p>
            <h2>{pendingCount}</h2>
            <span>Awaiting review</span>
          </div>
        </div>

        <div className="summary-card green">
          <div className="summary-icon">✓</div>
          <div className="summary-content">
            <p>Approved DTR</p>
            <h2>{approvedCount}</h2>
            <span>Already approved</span>
          </div>
        </div>

        <div className="summary-card red">
          <div className="summary-icon">!</div>
          <div className="summary-content">
            <p>Missing / Declined</p>
            <h2>{missingCount}</h2>
            <span>Needs attention</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>Employee DTR</h2>
            <p>
              Showing {filteredEmployees.length} of {employees.length} records
            </p>
          </div>

          {(canAdd || canEdit) && (
            <div className="header-actions">
              {canAdd && (
                <button className="add-month-btn" onClick={openAddEmployeeModal}>
                  Add Employee
                </button>
              )}

              {canEdit && (
                <button className="add-month-btn" onClick={addMonth}>
                  Add Month
                </button>
              )}
            </div>
          )}
        </div>

        <div className="filters-bar">
          <input
            className="search-input"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}>
            {offices.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {employmentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button className="clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>NO.</th>
                <th>EMPLOYEE</th>
                <th>DATE RECEIVED</th>
                <th>OFFICE</th>
                <th>POSITION</th>
                <th>EMPLOYMENT STATUS</th>

                {months.map((month) => (
                  <th key={month}>{month.toUpperCase()} 2026</th>
                ))}

                {(canEdit || canDelete) && <th>ACTIONS</th>}
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((emp, displayIndex) => {
                const realIndex = employees.findIndex((item) => item.id === emp.id);

                return (
                  <tr key={emp.id || displayIndex}>
                    <td>{displayIndex + 1}</td>
                    <td>{emp.name || "-"}</td>
                    <td>{emp.dateReceived?.slice(0, 10) || "-"}</td>
                    <td>{emp.office || "-"}</td>
                    <td>{emp.positionTitle || "-"}</td>
                    <td>
                      <strong>{emp.employmentStatus || "-"}</strong>
                    </td>

                    {months.map((month) => {
                      const remark = getRemark(emp, month);
                      const dtrText = getDtr(emp, month);

                      return (
                        <td key={`${emp.id}-${month}`} className="month-cell">
                          <span className={`remarks-badge ${remark.toLowerCase()}`}>
                            {remark}
                          </span>
                          <small>Remark: {dtrText}</small>
                        </td>
                      );
                    })}

                    {(canEdit || canDelete) && (
                      <td>
                        <div className="action-buttons">
                          {canEdit && (
                            <button
                              className="edit-btn"
                              onClick={() => openEditModal(realIndex)}
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              className="delete-btn"
                              onClick={() => deleteRow(realIndex)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={months.length + 6 + (canEdit || canDelete ? 1 : 0)}
                    className="empty-state"
                  >
                    No DTR records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <div>
                <p>EDIT RECORD</p>
                <h2>{editingEmployee.id ? "Edit Employee DTR" : "Add Employee DTR"}</h2>
              </div>

              <button type="button" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <div className="edit-modal-grid">
              <div>
                <label>Employee Name</label>
                <input
                  value={editingEmployee.name}
                  onChange={(e) => handleModalChange("name", e.target.value)}
                />
              </div>

              <div>
                <label>Date Received</label>
                <input
                  type="date"
                  value={editingEmployee.dateReceived?.slice(0, 10) || ""}
                  onChange={(e) => handleModalChange("dateReceived", e.target.value)}
                />
              </div>

              <div>
                <label>Office</label>
                <input
                  value={editingEmployee.office}
                  onChange={(e) => handleModalChange("office", e.target.value)}
                />
              </div>

              <div>
                <label>Position Title</label>
                <input
                  value={editingEmployee.positionTitle}
                  onChange={(e) => handleModalChange("positionTitle", e.target.value)}
                />
              </div>

              <div>
                <label>Employment Status</label>
                <input
                  value={editingEmployee.employmentStatus}
                  onChange={(e) => handleModalChange("employmentStatus", e.target.value)}
                />
              </div>
            </div>

            <div className="modal-month-section">
              <h3>Monthly DTR Records</h3>

              <div className="modal-month-grid">
                {months.map((month) => {
                  const remark =
                    editingEmployee.dtrData?.[month]?.remarks ||
                    editingEmployee.dtrData?.[month]?.status ||
                    "Pending";

                  const dtrText =
                    editingEmployee.dtrData?.[month]?.dtrs ||
                    editingEmployee.dtrData?.[month]?.remark ||
                    "";

                  return (
                    <div className="modal-month-card" key={month}>
                      <h4>{month} 2026</h4>

                      <label>DTR / Remark</label>
                      <input
                        value={dtrText}
                        placeholder="Remark"
                        onChange={(e) =>
                          handleModalDtrChange(month, "dtrs", e.target.value)
                        }
                      />

                      <label>Status</label>
                      <select
                        value={remark}
                        onChange={(e) =>
                          handleModalDtrChange(month, "remarks", e.target.value)
                        }
                        className={`remarks-select ${remark.toLowerCase()}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="edit-modal-actions">
              <button className="modal-cancel" onClick={closeEditModal}>
                Cancel
              </button>

              <button className="modal-save" onClick={saveModalRecord}>
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;