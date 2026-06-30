
import { useCallback, useEffect, useState } from "react";
import { Users, UserCheck, Building2, Clock, RefreshCw } from "lucide-react";

import { analyticsService } from "../api/analyticsService";
import Spinner from "../components/common/Spinner";
import Button from "../components/common/Button";
import StatCard from "../components/dashboard/StatCard";
import { DepartmentChart, RoleChart, StatusChart } from "../components/dashboard/Charts";
import CompletionWidget from "../components/dashboard/CompletionWidget";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setData(await analyticsService.get());
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load analytics");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error)
    return <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="secondary" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <CompletionWidget />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={data.total_employees} icon={Users}
          accent="bg-accent-50 text-accent-600 dark:bg-accent-700/20 dark:text-accent-400" />
        <StatCard label="Active Employees" value={data.active_employees} icon={UserCheck}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
        <StatCard label="Total Departments" value={data.total_departments} icon={Building2}
          accent="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" />
        <StatCard label="Pending Requests" value={data.pending_requests} icon={Clock}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DepartmentChart data={data.by_department} />
        <StatusChart data={data.by_status} />
      </div>
      <RoleChart data={data.by_role} />
    </div>
  );
}
