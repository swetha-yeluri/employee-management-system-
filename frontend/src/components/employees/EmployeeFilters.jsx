// Search box + department filter + a view toggle (table/cards).
import { Search, Plus, LayoutGrid, List } from "lucide-react";
import Button from "../common/Button";

export default function EmployeeFilters({
  search,
  onSearch,
  department,
  onDepartment,
  departments,
  view,
  onViewChange,
  canCreate,
  onCreate,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <select
          value={department}
          onChange={(e) => onDepartment(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-xl border border-zinc-200 p-0.5 dark:border-zinc-700">
          <button
            onClick={() => onViewChange("table")}
            className={`rounded-lg p-2 ${
              view === "table"
                ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-400"
            }`}
          >
            <List size={17} />
          </button>
          <button
            onClick={() => onViewChange("cards")}
            className={`rounded-lg p-2 ${
              view === "cards"
                ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-400"
            }`}
          >
            <LayoutGrid size={17} />
          </button>
        </div>

        {canCreate && (
          <Button onClick={onCreate}>
            <Plus size={17} /> Add Employee
          </Button>
        )}
      </div>
    </div>
  );
}
