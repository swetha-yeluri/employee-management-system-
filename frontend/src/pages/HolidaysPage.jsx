
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
const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];


export default function HolidaysPage() {
  const { isAdmin } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);          
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState(""); 
  const [yearFilter, setYearFilter] = useState("");   

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

  const startEdit = (h) => {
    setEditId(h.id);
    setForm({
      name: h.name, date: h.date, description: h.description || "",
      holiday_type: h.holiday_type, is_recurring: h.is_recurring,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.name || !form.date) { toast.error("Name and date are required"); return; }
    setSaving(true);
    try {
      if (editId) {
        await holidayService.update(editId, form);
        toast.success("Holiday updated");
      } else {
        await holidayService.create(form);
        toast.success("Holiday created");
      }
      setForm(EMPTY);
      setEditId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
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
    const okMonth = !monthFilter || h.date.slice(5, 7) === monthFilter;
    const okYear = !yearFilter || h.date.slice(0, 4) === yearFilter;    
    return okType && okSearch && okMonth && okYear;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = filtered.filter((h) => h.date >= todayStr);
  const past = filtered.filter((h) => h.date < todayStr);

  const renderRows = (list) =>
    list.map((h) => (
      <tr key={h.id} className="border-t border-zinc-100 dark:border-zinc-800">
        <td className="px-4 py-3 font-medium">{h.date}</td>
        <td className="px-4 py-3">
          {h.name}
          {h.is_recurring && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-accent-600">
              <Repeat size={12} /> yearly
            </span>
          )}
          {h.description && <p className="text-xs text-zinc-400">{h.description}</p>}
        </td>
        <td className="px-4 py-3 text-zinc-500">{h.holiday_type}</td>
        {isAdmin && (
          <td className="px-4 py-3 text-right">
            <button onClick={() => startEdit(h)} className="mr-3 text-accent-600 hover:text-accent-700">
              Edit
            </button>
            <button onClick={() => remove(h.id)} className="text-red-500 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </td>
        )}
      </tr>
    ));

  const Table = ({ title, list }) => (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="border-b border-zinc-200 px-4 py-3 font-display text-lg dark:border-zinc-800">{title}</h3>
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">No holidays.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800/60">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>{renderRows(list)}</tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="text-accent-600" size={22} />
        <h1 className="font-display text-2xl text-zinc-900 dark:text-zinc-50">Holiday Calendar</h1>
      </div>

      {/* Admin: create / edit form */}
      {isAdmin && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 font-display text-lg">{editId ? "Edit Holiday" : "Add Holiday"}</h3>
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
          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={saving}>
              <Plus size={16} /> {saving ? "Saving..." : editId ? "Update Holiday" : "Add Holiday"}
            </Button>
            {editId && <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>}
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
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <option value="">All months</option>
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <option value="">All years</option>
          {[...new Set(holidays.map((h) => h.date.slice(0, 4)))].sort().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Lists */}
      {loading ? (
        <Spinner label="Loading..." />
      ) : (
        <div className="space-y-6">
          <Table title="Upcoming Holidays" list={upcoming} />
          <Table title="Past Holidays" list={past} />
        </div>
      )}
    </div>
  );
}