
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Plus, Trash2, Repeat } from "lucide-react";

import { holidayService } from "../api/holidayService";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Spinner from "../components/common/Spinner";

const TYPES = ["Public Holiday", "Company Holiday", "Optional Holiday"];
const EMPTY = { name: "", date: "", description: "", holiday_type: "Public Holiday", is_recurring: false };

export default function HolidaysPage() {
  const { isAdmin } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setHolidays(await holidayService.getAll());
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: key === "is_recurring" ? e.target.checked : e.target.value }));

  const create = async () => {
    if (!form.name || !form.date) { toast.error("Name and date are required"); return; }
    setSaving(true);
    try {
      await holidayService.create(form);
      toast.success("Holiday created");
      setForm(EMPTY);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await holidayService.remove(id);
      toast.success("Holiday deleted");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    }
  };

  const filtered = holidays.filter((h) => {
    const okType = filterType === "All" || h.holiday_type === filterType;
    const okSearch = h.name.toLowerCase().includes(search.toLowerCase());
    return okType && okSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="text-accent-600" size={22} />
        <h1 className="font-display text-2xl text-zinc-900 dark:text-zinc-50">Holiday Calendar</h1>
      </div>

      {/* Admin: create form */}
      {isAdmin && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 font-display text-lg">Add Holiday</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name *" value={form.name} onChange={update("name")} placeholder="New Year" />
            <Input label="Date *" type="date" value={form.date} onChange={update("date")} />
            <Input label="Description" value={form.description} onChange={update("description")} placeholder="Optional" />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</span>
              <select value={form.holiday_type} onChange={update("holiday_type")}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_recurring} onChange={update("is_recurring")} />
            Recurring annually
          </label>
          <div className="mt-4">
            <Button onClick={create} disabled={saving}>
              <Plus size={16} /> {saving ? "Saving..." : "Add Holiday"}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <option>All</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? <Spinner label="Loading..." /> : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No holidays found.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 font-medium">{h.date}</td>
                  <td className="px-4 py-3">
                    {h.name}
                    {h.is_recurring && <span className="ml-2 inline-flex items-center gap-1 text-xs text-accent-600"><Repeat size={12} /> yearly</span>}
                    {h.description && <p className="text-xs text-zinc-400">{h.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{h.holiday_type}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(h.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}