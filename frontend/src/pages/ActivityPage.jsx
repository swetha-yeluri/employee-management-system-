// Admin-only: account activity for users in the company (Improvement 9).
// Shows last login/logout, browser, IP, and highlights new device / new IP.
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Activity, MonitorSmartphone, Globe } from "lucide-react";

import { activityService } from "../api/activityService";
import { formatDateTime } from "../utils/datetime";
import Spinner from "../components/common/Spinner";

const short = (ua) => {
  if (!ua) return "—";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return ua.slice(0, 24);
};

export default function ActivityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService
      .getAll()
      .then(setRows)
      .catch((err) => toast.error(err.response?.data?.detail || "Failed to load activity"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading activity..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-accent-600" />
        <h2 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Account Activity</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Last logout</th>
                <th className="px-4 py-3">Browser</th>
                <th className="px-4 py-3">IP address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((r) => (
                <tr key={r.user_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-800 dark:text-zinc-100">{r.user_name}</div>
                    <div className="text-xs text-zinc-400">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatDateTime(r.last_login)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatDateTime(r.last_logout)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
                      <MonitorSmartphone size={14} className="text-zinc-400" /> {short(r.browser)}
                    </span>
                    {r.new_device && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        New device
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
                      <Globe size={14} className="text-zinc-400" /> {r.ip || "—"}
                    </span>
                    {r.new_ip && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                        New IP
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
