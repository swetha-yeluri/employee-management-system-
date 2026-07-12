
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
  { key: "employees", label: "Employees", path: "/employees", icon: "Users" },
  { key: "departments", label: "Departments", path: "/departments", icon: "Building2", adminOnly: true },
  { key: "attendance", label: "Attendance", path: "/attendance", icon: "CalendarCheck" },
  { key: "members", label: "Members", path: "/members", icon: "UserCog", adminOnly: true },
  { key: "activity", label: "Activity", path: "/activity", icon: "Activity", adminOnly: true },
  { key: "audit", label: "Audit Logs", path: "/audit-logs", icon: "ScrollText", adminOnly: true },
  { key: "devices", label: "Login Devices", path: "/login-devices", icon: "MonitorSmartphone" },
  { key: "holidays", label: "Holiday Calendar", path: "/holidays", icon: "CalendarDays" },
  { key: "export", label: "Data Export Center", path: "/data-export", icon: "Download", adminOnly: true },
  { key: "settings", label: "Settings", path: "/settings", icon: "Settings" },
  { key: "completion", label: "Profile Completion", path: "/profile-completion", icon: "BarChart3", adminOnly: true },
  { key: "skills", label: "Skills & Certifications", path: "/skills", icon: "Award" },
  { key: "competencies", label: "Competencies", path: "/competencies", icon: "Search", adminOnly: true },
];

export const EMPLOYEE_STATUSES = ["Active", "Inactive", "On Leave"];
