
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Menu, Moon, Sun, LogOut, Bell, Search, Check, X,
  ShieldCheck, UserCheck, CalendarCheck, CalendarDays,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { roleRequestService } from "../../api/roleRequestService";
import { reactivationService } from "../../api/reactivationService";
import { attendanceService } from "../../api/attendanceService";
import { leaveService } from "../../api/leaveService";
import { reinstatementService } from "../../api/reinstatementService";
import { notificationService } from "../../api/notificationService";
import { formatDateTime } from "../../utils/datetime";

const ICONS = {
  notification: Bell,
  role: ShieldCheck,
  reactivation: UserCheck,
  attendance: CalendarCheck,
  leave: CalendarDays,
};

const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

export default function Navbar({ onToggleSidebar, title }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  
  const load = async () => {
    const notifs = await notificationService.getMine().catch(() => []);
    const notifItems = notifs.map((n) => ({
      id: `notif-${n.id}`, kind: "notification", time: n.created_at,
      title: "Notification", sub: n.message, unread: !n.is_read,
    }));
    if (isAdmin) {
      const [roles, reacts, attend, leaves, reinst] = await Promise.all([
        roleRequestService.getPending().catch(() => []),
        reactivationService.getPending().catch(() => []),
        attendanceService.getPendingAccess().catch(() => []),
        leaveService.getPending().catch(() => []),
        reinstatementService.getPending().catch(() => []),
      ]);
      const list = [
        ...roles.map((r) => ({
          id: `role-${r.id}`, kind: "role", actionable: true, time: r.created_at,
          title: "Admin access request", sub: r.requester_email,
          approve: () => roleRequestService.approve(r.id),
          reject: () => roleRequestService.reject(r.id),
        })),
        ...reacts.map((r) => ({
          id: `react-${r.id}`, kind: "reactivation", actionable: true, time: r.created_at,
          title: "Reactivation request", sub: r.user_email,
          approve: () => reactivationService.approve(r.id),
          reject: () => reactivationService.reject(r.id),
        })),
        ...attend.map((r) => ({
          id: `att-${r.id}`, kind: "attendance", actionable: true, time: r.created_at,
          title: "Attendance access request", sub: `${r.user_name} · ${r.user_email}`,
          approve: () => attendanceService.approveAccess(r.id),
          reject: () => attendanceService.rejectAccess(r.id),
        })),
        ...leaves.map((r) => ({
          id: `leave-${r.id}`, kind: "leave", actionable: true, time: r.created_at,
          title: `Leave request · ${r.leave_type}`,
          sub: `${r.user_email} · ${r.start_date} → ${r.end_date}`,
          approve: () => leaveService.approve(r.id),
          reject: () => leaveService.reject(r.id),
        })),
        ...reinst.map((r) => ({
          id: `reinst-${r.id}`, kind: "reactivation", actionable: true, time: r.created_at,
          title: "Reinstatement request", sub: `${r.user_email} · ${r.reason}`,
          approve: () => reinstatementService.approve(r.id),
          reject: () => reinstatementService.reject(r.id),
        })),
      ];
      list.sort((a, b) => new Date(b.time) - new Date(a.time));
      setItems([...notifItems, ...list]);
    } else {
      const [roleMine, reactMine, leaveMine] = await Promise.all([
        roleRequestService.getMine().catch(() => []),
        reactivationService.getMine().catch(() => []),
        leaveService.getMine().catch(() => []),
      ]);
      const list = [
        ...roleMine.map((r) => ({
          id: `role-${r.id}`, kind: "role", status: r.status, time: r.created_at,
          title: "Admin access request", sub: `Reviewer: ${r.admin_email}`,
        })),
        ...reactMine.map((r) => ({
          id: `react-${r.id}`, kind: "reactivation", status: r.status, time: r.created_at,
          title: "Reactivation request", sub: `Status updated`,
        })),
        ...leaveMine.map((r) => ({
          id: `leave-${r.id}`, kind: "leave", status: r.status, time: r.created_at,
          title: `Leave · ${r.leave_type}`, sub: `${r.start_date} → ${r.end_date}`,
        })),
      ];
      list.sort((a, b) => new Date(b.time) - new Date(a.time));
      setItems([...notifItems, ...list]);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const badge = items.filter((i) =>
    i.kind === "notification" ? i.unread : isAdmin ? i.actionable : i.status === "pending"
  ).length;

  const act = async (item, type) => {
    setBusyId(item.id);
    try {
      await (type === "approve" ? item.approve() : item.reject());
      toast.success(type === "approve" ? "Approved" : "Rejected");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Menu size={20} />
        </button>
        <h1 className="hidden font-display text-lg font-bold text-zinc-800 dark:text-zinc-50 sm:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            placeholder="Search here..."
            onKeyDown={(e) => e.key === "Enter" && navigate("/employees")}
            className="w-56 rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        {/* Notification bell + dropdown */}
        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => {
              const next = !open;
              setOpen(next);
              if (next) notificationService.markRead().then(load).catch(() => {});
            }}
            className="relative rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Notifications"
          >
            <Bell size={19} />
            {badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </button>

          {open && (
            <div
              ref={panelRef}
              className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  Notifications
                </span>
                <span className="text-xs text-zinc-400">{items.length}</span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-zinc-400">
                    You're all caught up.
                  </p>
                ) : (
                  items.map((item) => {
                    const Icon = ICONS[item.kind] || Bell;
                    return (
                      <div
                        key={item.id}
                        className="flex gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800"
                      >
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-700/20 dark:text-accent-400">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-zinc-500">{item.sub}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-400">
                            {formatDateTime(item.time)}
                          </p>

                          {item.actionable ? (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => act(item, "approve")}
                                disabled={busyId === item.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-accent-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-accent-700 disabled:opacity-60"
                              >
                                <Check size={13} /> Approve
                              </button>
                              <button
                                onClick={() => act(item, "reject")}
                                disabled={busyId === item.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                <X size={13} /> Reject
                              </button>
                            </div>
                          ) : (
                            item.status && (
                              <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[item.status] || STATUS_STYLE.pending}`}>
                                {item.status}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {isAdmin && items.length > 0 && (
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/settings");
                  }}
                  className="block w-full border-t border-zinc-200 px-4 py-2.5 text-center text-xs font-semibold text-accent-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  Review all in Settings
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="flex items-center gap-2 rounded-lg px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
            {(user?.email?.[0] || "U").toUpperCase()}
          </div>
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {user?.role === "admin" ? "Admin User" : "User"}
            </p>
            <p className="text-[11px] capitalize text-zinc-400">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
