// Core employee management page. Wires together data fetching, search/filter,
// the table/card views, and full CRUD via modal forms (Tasks 2, 4, 6).
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertCircle, Users } from "lucide-react";

import { employeeService } from "../api/employeeService";
import { useAuth } from "../context/AuthContext";

import Spinner from "../components/common/Spinner";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Button from "../components/common/Button";

import EmployeeFilters from "../components/employees/EmployeeFilters";
import EmployeeTable from "../components/employees/EmployeeTable";
import EmployeeCard from "../components/employees/EmployeeCard";
import EmployeeForm from "../components/employees/EmployeeForm";

export default function EmployeesPage() {
  const { isAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [view, setView] = useState("table");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferDept, setTransferDept] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);

  const openTransfer = (employee) => {
    setTransferTarget(employee);
    setTransferDept(String(employee.department?.id || ""));
    setTransferHistory([]);
    employeeService
      .getTransfers(employee.id)
      .then(setTransferHistory)
      .catch(() => setTransferHistory([]));
  };

  const handleTransfer = async () => {
    if (!transferDept) {
      toast.error("Pick a department");
      return;
    }
    setTransferring(true);
    try {
      await employeeService.transfer(transferTarget.id, Number(transferDept));
      toast.success("Employee transferred");
      setTransferTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [emps, depts] = await Promise.all([
        employeeService.getAll(),
        employeeService.getDepartments(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load employees. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = emp.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDept =
        !department || String(emp.department?.id) === String(department);
      return matchesSearch && matchesDept;
    });
  }, [employees, search, department]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (employee) => {
    setEditing(employee);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await employeeService.update(editing.id, payload);
        toast.success("Employee updated");
      } else {
        await employeeService.create(payload);
        toast.success("Employee added");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await employeeService.remove(deleteTarget.id);
      toast.success("Employee deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Delete failed");
    }
  };

  if (loading) return <Spinner label="Loading employees..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-16 text-center dark:border-red-500/20 dark:bg-red-500/5">
        <AlertCircle className="text-red-500" />
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="secondary" onClick={loadData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <EmployeeFilters
        search={search}
        onSearch={setSearch}
        department={department}
        onDepartment={setDepartment}
        departments={departments}
        view={view}
        onViewChange={setView}
        canCreate={isAdmin}
        onCreate={openCreate}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Users className="text-zinc-300" size={36} />
          <p className="text-sm text-zinc-500">No employees match your filters.</p>
        </div>
      ) : view === "table" ? (
        <EmployeeTable
          employees={filtered}
          canManage={isAdmin}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onTransfer={openTransfer}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              canManage={isAdmin}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Edit Employee" : "Add Employee"}
        onClose={() => setFormOpen(false)}
      >
        <EmployeeForm
          initial={editing}
          departments={departments}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        open={Boolean(transferTarget)}
        title="Transfer department"
        onClose={() => setTransferTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Move <span className="font-semibold text-zinc-800 dark:text-zinc-100">{transferTarget?.name}</span>{" "}
            from <span className="font-medium">{transferTarget?.department?.name || "Unassigned"}</span> to:
          </p>
          <select
            value={transferDept}
            onChange={(e) => setTransferDept(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTransferTarget(null)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={transferring}>
              {transferring ? "Transferring..." : "Transfer"}
            </Button>
          </div>

          {transferHistory.length > 0 && (
            <div className="mt-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Transfer history
              </p>
              <div className="space-y-1.5">
                {transferHistory.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                    <span>{t.from_department} → {t.to_department}</span>
                    <span className="text-zinc-400">{new Date(t.created_at + "Z").toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete employee"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
