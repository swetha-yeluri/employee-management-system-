// Sortable, paginated table view of employees.
import { useState, useMemo } from "react";
import { Pencil, Trash2, ChevronUp, ChevronDown, ArrowRightLeft } from "lucide-react";
import StatusBadge from "./StatusBadge";

const PAGE_SIZE = 6;

export default function EmployeeTable({ employees, canManage, onEdit, onDelete, onTransfer }) {
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...employees];
    copy.sort((a, b) => {
      const av = (a[sort.key] || "").toString().toLowerCase();
      const bv = (b[sort.key] || "").toString().toLowerCase();
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [employees, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (key) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const SortHeader = ({ label, k }) => (
    <button
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 font-semibold"
    >
      {label}
      {sort.key === k &&
        (sort.dir === "asc" ? (
          <ChevronUp size={13} />
        ) : (
          <ChevronDown size={13} />
        ))}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
            <tr>
              <th className="px-5 py-3"><SortHeader label="Name" k="name" /></th>
              <th className="px-5 py-3"><SortHeader label="Position" k="position" /></th>
              <th className="px-5 py-3 hidden md:table-cell">Department</th>
              <th className="px-5 py-3"><SortHeader label="Status" k="status" /></th>
              {canManage && <th className="px-5 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {pageRows.map((emp) => (
              <tr
                key={emp.id}
                className="transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                <td className="px-5 py-3">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {emp.name}
                  </p>
                  <p className="text-xs text-zinc-400">{emp.email}</p>
                </td>
                <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                  {emp.position}
                </td>
                <td className="px-5 py-3 hidden text-zinc-600 dark:text-zinc-300 md:table-cell">
                  {emp.department?.name || "—"}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={emp.status} />
                </td>
                {canManage && (
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onTransfer(emp)}
                        title="Transfer department"
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-zinc-800"
                      >
                        <ArrowRightLeft size={15} />
                      </button>
                      <button
                        onClick={() => onEdit(emp)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-zinc-800"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(emp)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3 text-sm text-zinc-500 dark:border-zinc-800">
        <span>
          Page {safePage} of {totalPages} · {sorted.length} employees
        </span>
        <div className="flex gap-2">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-zinc-200 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Prev
          </button>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-zinc-200 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
