// Dark navy sidebar matching the reference UI. Brand shows the real project
// name. Admin-only / user-only items are filtered by role.
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, CalendarCheck,
  Settings, Inbox, ScrollText, Users2, UserCog, UserCheck, Activity, Download,
} from "lucide-react";

import { NAV_ITEMS } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";

const ICONS = {
  LayoutDashboard, Users, Building2, CalendarCheck, Settings, Inbox, ScrollText, UserCog, UserCheck, Activity, Download,
};

export default function Sidebar({ open }) {
  const { user, isAdmin } = useAuth();
  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.userOnly) return !isAdmin;
    return true;
  });

  return (
    <aside
      className={`${
        open ? "w-64" : "w-0 md:w-20"
      } fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden bg-sidebar text-slate-300 transition-all duration-300 md:static dark:bg-sidebar-dark`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white">
          <Users2 size={18} />
        </div>
        {open && (
          <span className="font-display text-sm font-bold leading-tight text-white">
            Employee Management System
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent-600 text-white"
                    : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                }`
              }
            >
              <Icon size={19} className="shrink-0" />
              {open && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      {open && (
        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-white">
            {(user?.email?.[0] || "U").toUpperCase()}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{user?.email}</p>
            <p className="text-xs capitalize text-slate-400">
              {user?.role === "admin" ? "Administrator" : "User"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
