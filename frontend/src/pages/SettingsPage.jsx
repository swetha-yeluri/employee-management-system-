// Settings hub (available to everyone).
//  - Admin: review & approve/reject Role Requests AND Reactivation Requests.
//  - User : request promotion to Admin + track status.
//  - Both : account info + appearance (theme).
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, Inbox, UserCheck, Check, X,
  CalendarCheck, CalendarDays,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { roleRequestService } from "../api/roleRequestService";
import { reactivationService } from "../api/reactivationService";
import { attendanceService } from "../api/attendanceService";
import { leaveService } from "../api/leaveService";
import { reinstatementService } from "../api/reinstatementService";
import { formatDateTime } from "../utils/datetime";

import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";

const STATUS_META = {
  pending: { icon: Clock, tone: "text-amber-600", label: "Pending review" },
  approved: { icon: CheckCircle2, tone: "text-accent-600", label: "Approved" },
  rejected: { icon: XCircle, tone: "text-red-500", label: "Rejected" },
};

/* ---------------- Admin: an approve/reject list section ---------------- */
function ApprovalSection({ title, icon: Icon, emptyText, items, onApprove, onReject, render }) {
  const [busyId, setBusyId] = useState(null);

  const act = async (id, fn, okMsg) => {
    setBusyId(id);
    try {
      await fn(id);
      toast.success(okMsg);
      onApprove(id); // remove from list (handled by parent)
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-accent-600" />
        <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">{title}</h3>
        {items.length > 0 && (
          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:bg-accent-700/20 dark:text-accent-400">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
          {emptyText}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>{render(r)}</div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => act(r.id, onReject.fn, onReject.msg)}
                  disabled={busyId === r.id}
                >
                  <X size={16} /> Reject
                </Button>
                <Button
                  onClick={() => act(r.id, onApprove.fn, onApprove.msg)}
                  disabled={busyId === r.id}
                >
                  <Check size={16} /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const { user, isAdmin, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // user-side role request
  const [form, setForm] = useState({ currentPassword: "", adminEmail: "" });
  const [errors, setErrors] = useState({});
  const [myRequests, setMyRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // admin-side pending lists
  const [roleReqs, setRoleReqs] = useState([]);
  const [reactivations, setReactivations] = useState([]);
  const [attendanceReqs, setAttendanceReqs] = useState([]);
  const [leaveReqs, setLeaveReqs] = useState([]);
  const [reinstatements, setReinstatements] = useState([]);

  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [rr, ra, aa, lv, ri] = await Promise.all([
          roleRequestService.getPending(),
          reactivationService.getPending(),
          attendanceService.getPendingAccess(),
          leaveService.getPending(),
          reinstatementService.getPending(),
        ]);
        setRoleReqs(rr);
        setReactivations(ra);
        setAttendanceReqs(aa);
        setLeaveReqs(lv);
        setReinstatements(ri);
      } else {
        setMyRequests(await roleRequestService.getMine());
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const update = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.currentPassword) next.currentPassword = "Enter your current password";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.adminEmail))
      next.adminEmail = "Enter a valid admin email";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitRoleRequest = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await roleRequestService.create(form.currentPassword, form.adminEmail);
      toast.success("Request sent for admin approval");
      setForm({ currentPassword: "", adminEmail: "" });
      setMyRequests(await roleRequestService.getMine());
    } catch (err) {
      toast.error(err.response?.data?.detail || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = myRequests.some((r) => r.status === "pending");

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Account</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Role</dt>
            <dd className="font-medium capitalize">{user?.role}</dd>
          </div>
        </dl>
      </section>

      {loading ? (
        <Spinner label="Loading..." />
      ) : isAdmin ? (
        <>
          {/* Admin: Role Requests */}
          <ApprovalSection
            title="Role Requests"
            icon={Inbox}
            emptyText="No pending role requests."
            items={roleReqs}
            render={(r) => (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{r.requester_email}</p>
                <p className="text-zinc-500">
                  Requesting promotion to{" "}
                  <span className="font-medium capitalize">{r.requested_role}</span>
                </p>
              </>
            )}
            onApprove={{
              fn: async (id) => {
                await roleRequestService.approve(id);
                setRoleReqs((p) => p.filter((x) => x.id !== id));
              },
              msg: "Approved — user promoted to admin",
            }}
            onReject={{
              fn: async (id) => {
                await roleRequestService.reject(id);
                setRoleReqs((p) => p.filter((x) => x.id !== id));
              },
              msg: "Request rejected",
            }}
          />

          {/* Admin: Reactivation Requests */}
          <ApprovalSection
            title="Reactivation Requests"
            icon={UserCheck}
            emptyText="No pending reactivation requests."
            items={reactivations}
            render={(r) => (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{r.user_email}</p>
                <p className="text-zinc-500">Requesting account reactivation</p>
              </>
            )}
            onApprove={{
              fn: async (id) => {
                await reactivationService.approve(id);
                setReactivations((p) => p.filter((x) => x.id !== id));
              },
              msg: "Reactivation approved — access restored",
            }}
            onReject={{
              fn: async (id) => {
                await reactivationService.reject(id);
                setReactivations((p) => p.filter((x) => x.id !== id));
              },
              msg: "Reactivation rejected",
            }}
          />

          {/* Admin: Attendance Access Requests */}
          <ApprovalSection
            title="Attendance Access Requests"
            icon={CalendarCheck}
            emptyText="No pending attendance access requests."
            items={attendanceReqs}
            render={(r) => (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{r.user_name}</p>
                <p className="text-zinc-500">
                  {r.user_email} · requested {formatDateTime(r.created_at)}
                </p>
              </>
            )}
            onApprove={{
              fn: async (id) => {
                await attendanceService.approveAccess(id);
                setAttendanceReqs((p) => p.filter((x) => x.id !== id));
              },
              msg: "Attendance access granted",
            }}
            onReject={{
              fn: async (id) => {
                await attendanceService.rejectAccess(id);
                setAttendanceReqs((p) => p.filter((x) => x.id !== id));
              },
              msg: "Attendance access rejected",
            }}
          />

          {/* Admin: Leave Requests */}
          <ApprovalSection
            title="Leave Requests"
            icon={CalendarDays}
            emptyText="No pending leave requests."
            items={leaveReqs}
            render={(r) => (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{r.user_email}</p>
                <p className="text-zinc-500">
                  <span className="font-medium">{r.leave_type}</span> · {r.start_date} → {r.end_date}
                </p>
                <p className="text-xs text-zinc-400">Reason: {r.reason}</p>
              </>
            )}
            onApprove={{
              fn: async (id) => {
                await leaveService.approve(id);
                setLeaveReqs((p) => p.filter((x) => x.id !== id));
              },
              msg: "Leave approved",
            }}
            onReject={{
              fn: async (id) => {
                await leaveService.reject(id);
                setLeaveReqs((p) => p.filter((x) => x.id !== id));
              },
              msg: "Leave rejected",
            }}
          />

          {/* Admin: Reinstatement Requests (Improvement 11) */}
          <ApprovalSection
            title="Reinstatement Requests"
            icon={ShieldCheck}
            emptyText="No pending reinstatement requests."
            items={reinstatements}
            render={(r) => (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{r.user_email}</p>
                <p className="text-zinc-500">Reason: {r.reason}</p>
              </>
            )}
            onApprove={{
              fn: async (id) => {
                await reinstatementService.approve(id);
                setReinstatements((p) => p.filter((x) => x.id !== id));
              },
              msg: "User reinstated",
            }}
            onReject={{
              fn: async (id) => {
                await reinstatementService.reject(id);
                setReinstatements((p) => p.filter((x) => x.id !== id));
              },
              msg: "Reinstatement rejected",
            }}
          />
        </>
      ) : (
        /* User: Request Admin Access */
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent-600" />
            <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Request Admin Access</h3>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Verify your password and name an admin to review your request. Your role
            changes only after they approve it.
          </p>

          {myRequests.length > 0 && (
            <div className="mt-4 space-y-2">
              {myRequests.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.pending;
                const Icon = meta.icon;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-700"
                  >
                    <span className="text-zinc-500">Reviewer: {r.admin_email}</span>
                    <span className={`flex items-center gap-1.5 font-semibold ${meta.tone}`}>
                      <Icon size={15} /> {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!hasPending && (
            <div className="mt-4 space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={form.currentPassword}
                onChange={update("currentPassword")}
                error={errors.currentPassword}
                placeholder="Verify it's you"
              />
              <Input
                label="Admin Email (reviewer)"
                type="email"
                value={form.adminEmail}
                onChange={update("adminEmail")}
                error={errors.adminEmail}
                placeholder="admin@gmail.com"
              />
              <Button onClick={submitRoleRequest} disabled={submitting}>
                {submitting ? "Sending..." : "Submit Request"}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Appearance */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Appearance</h3>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Current theme: <span className="font-medium capitalize">{theme}</span>
          </p>
          <Button variant="secondary" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </Button>
        </div>
      </section>
    </div>
  );
}