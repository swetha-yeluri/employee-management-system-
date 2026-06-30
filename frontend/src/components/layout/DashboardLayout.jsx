
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { NAV_ITEMS } from "../../utils/constants";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const current = NAV_ITEMS.find((i) => location.pathname.startsWith(i.path));
  const title = current?.label || "Dashboard";

  return (
    <div className="flex min-h-screen bg-page dark:bg-slate-950">
      <Sidebar open={sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={title}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
        />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-fade-up mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
