// Attendance module.
//  - Admin: company attendance overview + CSV download (existing behaviour).
//  - User : approval-gated module. Before approval -> "Access Pending" screen
//           (a request is auto-created server-side). After approval -> check
//           in/out, today's status, total hours, recent history, and leave.
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Download, Clock, LogIn, LogOut, CalendarDays, Hourglass, Plus, ShieldAlert,
} from "lucide-react";

import { employeeService } from "../api/employeeService";
import { reportService } from "../api/reportService";
import { attendanceService } from "../api/attendanceService";
import { leaveService } from "../api/leaveService";
import { useAuth } from "../context/AuthContext";

import Spinner from "../components/common/Spinner";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import { formatTime as fmtTime, formatDateTime as fmtDate } from "../utils/datetime";

/* ===================== ADMIN VIEW (overview + CSV) ===================== */
function AdminAttendance() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    employeeService.getAll().then(setEmployees).finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await reportService.downloadAttendanceReport();
      toast.success("Report downloaded");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Spinner label="Loading attendance..." />;

  const present = employees.filter((e) => e.status === "Active").length;
  const rate = employees.length ? Math.round((present / employees.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Today's attendance rate</p>
          <p className="mt-1 font-display text-4xl text-zinc-900 dark:text-zinc-50">{rate}%</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full rounded-full bg-accent-600 transition-all" style={{ width: `${rate}%` }} />
          </div>
        </div>
        <Button onClick={handleDownload} disabled={downloading}>
          <Download size={17} />
          {downloading ? "Preparing..." : "Download Report (CSV)"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-100">{emp.name}</td>
                <td className="px-5 py-3 text-zinc-500">{emp.department?.name || "—"}</td>
                <td className="px-5 py-3 text-zinc-500">{emp.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===================== USER: pending-access screen ===================== */
function PendingAccess({ submittedOn, rejected }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15">
        <ShieldAlert size={28} />
      </div>
      <h2 className="font-display text-2xl text-zinc-900 dark:text-zinc-50">
        Attendance Access {rejected ? "Rejected" : "Pending"}
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Your account is not linked to an employee profile yet. A request has been
        sent to your company admin for approval.
      </p>
      <p className="mt-4 inline-block rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        Submitted on: <span className="font-medium">{fmtDate(submittedOn)}</span>
      </p>
    </div>
  );
}

/* ===================== USER: attendance module ===================== */
function UserAttendance() {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(null);
  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState({ total_hours: 0, days: 0 });
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [busy, setBusy] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: "Casual", start_date: "", end_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadModule = async () => {
    const [t, s, h, l] = await Promise.all([
      attendanceService.getToday(),
      attendanceService.getSummary(),
      attendanceService.getHistory(),
      leaveService.getMine(),
    ]);
    setToday(t); setSummary(s); setHistory(h); setLeaves(l);
  };

  const init = async () => {
    setLoading(true);
    try {
      const a = await attendanceService.getAccess(); // auto-creates request if none
      setAccess(a);
      if (a.has_access) await loadModule();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const check = async (kind) => {
    setBusy(true);
    try {
      kind === "in" ? await attendanceService.checkIn() : await attendanceService.checkOut();
      toast.success(kind === "in" ? "Checked in" : "Checked out");
      await loadModule();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const submitLeave = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date || leaveForm.reason.trim().length < 3) {
      toast.error("Fill leave type, dates, and a reason");
      return;
    }
    setSubmitting(true);
    try {
      await leaveService.submit(leaveForm);
      toast.success("Leave request submitted");
      setLeaveForm({ leave_type: "Casual", start_date: "", end_date: "", reason: "" });
      setLeaves(await leaveService.getMine());
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit leave");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading attendance..." />;
  if (!access?.has_access)
    return <PendingAccess submittedOn={access?.submitted_on} rejected={access?.status === "rejected"} />;

  const checkedIn = today?.checked_in;
  const checkedOut = today?.checked_out;
  const statusBadge = (s) => {
    const map = {
      pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
      approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
      rejected: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    };
    return `rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[s] || map.pending}`;
  };

  return (
    <div className="space-y-6">
      {/* Today + actions */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500"><Clock size={16} /> Today</div>
          <p className="mt-2 text-sm">Check-in: <span className="font-semibold">{fmtTime(today?.record?.check_in)}</span></p>
          <p className="text-sm">Check-out: <span className="font-semibold">{fmtTime(today?.record?.check_out)}</span></p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500"><Hourglass size={16} /> Total hours</div>
          <p className="mt-2 font-display text-3xl text-zinc-900 dark:text-zinc-50">{summary.total_hours}</p>
          <p className="text-xs text-zinc-400">across {summary.days} day(s)</p>
        </div>
        <div className="flex flex-col justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <Button onClick={() => check("in")} disabled={busy || (checkedIn && !checkedOut)}>
            <LogIn size={16} /> Check In
          </Button>
          <Button variant="secondary" onClick={() => check("out")} disabled={busy || !checkedIn || checkedOut}>
            <LogOut size={16} /> Check Out
          </Button>
        </div>
      </section>

      {/* History */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="flex items-center gap-2 border-b border-zinc-200 px-5 py-3 font-display text-lg text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          <CalendarDays size={18} className="text-accent-600" /> Recent Attendance
        </h3>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">No attendance records yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
              <tr><th className="px-5 py-2.5">Date</th><th className="px-5 py-2.5">In</th><th className="px-5 py-2.5">Out</th><th className="px-5 py-2.5">Hours</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {history.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-2.5">{r.work_date}</td>
                  <td className="px-5 py-2.5">{fmtTime(r.check_in)}</td>
                  <td className="px-5 py-2.5">{fmtTime(r.check_out)}</td>
                  <td className="px-5 py-2.5">{r.work_hours ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Leave */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Apply for Leave</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Leave type</span>
            <select
              value={leaveForm.leave_type}
              onChange={(e) => setLeaveForm((p) => ({ ...p, leave_type: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Casual</option><option>Sick</option><option>Earned</option><option>Other</option>
            </select>
          </label>
          <div />
          <Input label="Start date" type="date" value={leaveForm.start_date}
            onChange={(e) => setLeaveForm((p) => ({ ...p, start_date: e.target.value }))} />
          <Input label="End date" type="date" value={leaveForm.end_date}
            onChange={(e) => setLeaveForm((p) => ({ ...p, end_date: e.target.value }))} />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Reason</span>
            <textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>
        <div className="mt-3">
          <Button onClick={submitLeave} disabled={submitting}>
            <Plus size={16} /> {submitting ? "Submitting..." : "Submit Leave Request"}
          </Button>
        </div>

        <h4 className="mb-2 mt-6 text-sm font-semibold text-zinc-600 dark:text-zinc-300">My Leave Requests</h4>
        {leaves.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 py-5 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No leave requests yet.
          </p>
        ) : (
          <div className="space-y-2">
            {leaves.map((l) => (
              <div key={l.id} className="flex flex-col gap-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-zinc-700 dark:text-zinc-200">
                  <span className="font-semibold">{l.leave_type}</span> · {l.start_date} → {l.end_date}
                </span>
                <span className={statusBadge(l.status)}>{l.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AttendancePage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminAttendance /> : <UserAttendance />;
}
