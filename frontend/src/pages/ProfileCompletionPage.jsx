
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3 } from "lucide-react";

import { employeeService } from "../api/employeeService";
import Spinner from "../components/common/Spinner";

export default function ProfileCompletionPage() {
  const [rows, setRows] = useState([]);
  const [threshold, setThreshold] = useState(100);
  const [loading, setLoading] = useState(true);

  const load = async (t) => {
    setLoading(true);
    try {
      const data = await employeeService.getAllCompletion(t);
      setRows(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(threshold);
    
  }, [threshold]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-accent-600" size={22} />
        <h1 className="font-display text-2xl text-zinc-900 dark:text-zinc-50">
          Profile Completion
        </h1>
      </div>

      {/* Threshold filter */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <label className="text-sm text-zinc-600 dark:text-zinc-300">
          Show profiles below:
        </label>
        <select
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value={100}>100% (all)</option>
          <option value={80}>80%</option>
          <option value={50}>50%</option>
          <option value={30}>30%</option>
        </select>
      </div>

      {loading ? (
        <Spinner label="Loading..." />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No employees below {threshold}%.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Missing Fields</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{r.name}</p>
                    <p className="text-xs text-zinc-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 rounded-full bg-zinc-100 dark:bg-zinc-700">
                        <div
                          className={`h-2 rounded-full ${
                            r.percent === 100 ? "bg-emerald-500"
                            : r.percent >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${r.percent}%` }}
                        />
                      </div>
                      <span className="font-semibold">{r.percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {r.missing.length === 0 ? "—" : r.missing.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}