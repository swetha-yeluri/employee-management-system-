import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Download } from "lucide-react";

import { skillService } from "../api/skillService";
import Spinner from "../components/common/Spinner";

const LEVELS = ["", "Beginner", "Intermediate", "Advanced", "Expert"];
const CERT_STATUSES = ["", "Valid", "Expired", "Expiring Soon"];

export default function AdminCompetenciesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ skill: "", level: "", min_experience: 0, cert_name: "", cert_status: "" });

  const load = async () => {
    setLoading(true);
    try {
      setRows(await skillService.adminCompetencies(f));
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const upd = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const exportCSV = () => {
    if (rows.length === 0) { toast.error("Nothing to export"); return; }
    const lines = ["Employee,Email,Skills,Certifications"];
    rows.forEach((emp) => {
      const skills = emp.skills.map((s) => `${s.name} (${s.proficiency}, ${s.years_experience}yr)`).join("; ");
      const certs = emp.certifications.map((c) => `${c.name} (${c.status})`).join("; ");
      lines.push(`"${emp.name}","${emp.email}","${skills}","${certs}"`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "competency_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-zinc-900 dark:text-zinc-50">Employee Competencies</h1>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft sm:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-900">
        <input placeholder="Skill name" value={f.skill} onChange={upd("skill")}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        <select value={f.level} onChange={upd("level")}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {LEVELS.map((l) => <option key={l} value={l}>{l || "Any level"}</option>)}
        </select>
        <input type="number" placeholder="Min years" value={f.min_experience} onChange={upd("min_experience")}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        <input placeholder="Certification name" value={f.cert_name} onChange={upd("cert_name")}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        <select value={f.cert_status} onChange={upd("cert_status")}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {CERT_STATUSES.map((s) => <option key={s} value={s}>{s || "Any cert status"}</option>)}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={load}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white">
          <Search size={16} /> Search
        </button>
        <button onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold dark:border-zinc-700">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {loading ? <Spinner label="Loading..." /> : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No employees match these filters.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((emp) => (
            <div key={emp.employee_id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{emp.name}</p>
              <p className="text-xs text-zinc-500">{emp.email}</p>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-zinc-400">Skills</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {emp.skills.length === 0 ? <span className="text-xs text-zinc-400">—</span> :
                    emp.skills.map((s, i) => (
                      <span key={i} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs dark:bg-zinc-800">
                        {s.name} · {s.proficiency} · {s.years_experience}yr{s.is_primary ? " ★" : ""}
                      </span>
                    ))}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-zinc-400">Certifications</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {emp.certifications.length === 0 ? <span className="text-xs text-zinc-400">—</span> :
                    emp.certifications.map((c, i) => (
                      <span key={i} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs dark:bg-zinc-800">
                        {c.name} ({c.status})
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}