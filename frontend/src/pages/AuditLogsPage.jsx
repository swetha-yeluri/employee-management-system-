
import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";

import { auditService } from "../api/auditService";
import { formatDateTime } from "../utils/datetime";
import Spinner from "../components/common/Spinner";
import Badge from "../components/common/Badge";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.getLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading activity history..." />;

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <ScrollText className="text-zinc-300" size={36} />
        <p className="text-sm text-zinc-500">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
          <tr>
            <th className="px-5 py-3">User</th>
            <th className="px-5 py-3">Action</th>
            <th className="px-5 py-3 hidden md:table-cell">Related</th>
            <th className="px-5 py-3">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((log) => (
            <tr key={log.id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-100">{log.user_name}</td>
              <td className="px-5 py-3"><Badge tone="accent">{log.action}</Badge></td>
              <td className="px-5 py-3 hidden text-zinc-500 md:table-cell">{log.target || "—"}</td>
              <td className="px-5 py-3 text-zinc-500">{formatDateTime(log.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
