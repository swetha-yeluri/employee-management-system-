// Card view of a single employee with a profile preview and quick actions.
import { Pencil, Trash2, Mail } from "lucide-react";
import StatusBadge from "./StatusBadge";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function EmployeeCard({ employee, canManage, onEdit, onDelete }) {
  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-600 font-display text-sm text-white">
            {initials(employee.name)}
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {employee.name}
            </p>
            <p className="text-xs text-zinc-500">{employee.position}</p>
          </div>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
        <Mail size={15} />
        <span className="truncate">{employee.email}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {employee.department?.name || "Unassigned"}
        </span>
        {canManage && (
          <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => onEdit(employee)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-zinc-800"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(employee)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
