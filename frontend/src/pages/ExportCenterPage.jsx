// Admin-only Data Export Center (Improvement 10).
// Export Employees / Attendance / Leaves / Audit Logs / Notifications / Analytics
// as CSV / Excel / PDF, and view export history (who / when / what).
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Download, Users, CalendarCheck, CalendarDays, ScrollText, Bell, BarChart3, FileSpreadsheet, FileText, FileType,
} from "lucide-react";

import { exportService } from "../api/exportService";
import { formatDateTime } from "../utils/datetime";
import Spinner from "../components/common/Spinner";

const DATASETS = [
  { key: "employees", label: "Employees", icon: Users },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "leaves", label: "Leave Requests", icon: CalendarDays },
  { key: "audit-logs", label: "Audit Logs", icon: ScrollText },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

const FORMATS = [
  { key: "csv", label: "CSV", icon: FileText },
  { key: "excel", label: "Excel", icon: FileSpreadsheet },
  { key: "pdf", label: "PDF", icon: FileType },
];

export default function ExportCenterPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const loadHistory = () =>
    exportService.getHistory().then(setHistory).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => {
    loadHistory();
  }, []);

  const doExport = async (dataType, fmt) => {
    setBusy(`${dataType}-${fmt}`);
    try {
      await exportService.download(dataType, fmt);
      toast.success("Export downloaded");
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Export failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Download size={18} className="text-accent-600" />
        <h2 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Data Export Center</h2>
      </div>

      {/* Export grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DATASETS.map((d) => {
          const Icon = d.icon;
          return (
            <div key={d.key} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-700/20 dark:text-accent-400">
                  <Icon size={18} />
                </div>
                <h3 className="font-display text-base text-zinc-900 dark:text-zinc-50">{d.label}</h3>
              </div>
              <div className="mt-4 flex gap-2">
                {FORMATS.map((f) => {
                  const FIcon = f.icon;
                  const id = `${d.key}-${f.key}`;
                  return (
                    <button
                      key={f.key}
                      onClick={() => doExport(d.key, f.key)}
                      disabled={busy === id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-2 text-xs font-semibold text-zinc-600 transition hover:border-accent-400 hover:bg-accent-50 hover:text-accent-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-accent-700/10"
                    >
                      <FIcon size={14} /> {busy === id ? "..." : f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export history */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="border-b border-zinc-200 px-5 py-3 font-display text-base text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          Export history
        </h3>
        {loading ? (
          <div className="p-6"><Spinner label="Loading history..." /></div>
        ) : history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">No exports yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-5 py-2.5">Who exported</th>
                <th className="px-5 py-2.5">What data</th>
                <th className="px-5 py-2.5">Format</th>
                <th className="px-5 py-2.5">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="px-5 py-2.5 font-medium text-zinc-800 dark:text-zinc-100">{h.exported_by}</td>
                  <td className="px-5 py-2.5 capitalize text-zinc-600 dark:text-zinc-300">{h.data_type.replace("-", " ")}</td>
                  <td className="px-5 py-2.5 uppercase text-zinc-500">{h.file_format}</td>
                  <td className="px-5 py-2.5 text-zinc-500">{formatDateTime(h.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
