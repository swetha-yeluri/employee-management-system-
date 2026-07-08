// Login Devices (Task 14 + 15). Users manage own devices; admins monitor all
// company sessions, force-logout / revoke (single or multiple), filter, search.
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MonitorSmartphone, LogOut, Pencil, ShieldX, Ban } from "lucide-react";

import { sessionService } from "../api/sessionService";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/datetime";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";

const STATUS = {
  active: "bg-emerald-50 text-emerald-700",
  logged_out: "bg-zinc-100 text-zinc-500",
  revoked: "bg-red-50 text-red-600",
  expired: "bg-amber-50 text-amber-700",
};

export default function LoginDevicesPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("mine");
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState([]);   // multiple revoke

  const load = async () => {
    setLoading(true);
    try {
      setMine(await sessionService.getMine());
      if (isAdmin) setAll(await sessionService.getAll());
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rename = async (id) => {
    const name = window.prompt("New device name:");
    if (!name) return;
    try { await sessionService.rename(id, name); toast.success("Renamed"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const act = async (fn, id, msg) => {
    try { await fn(id); toast.success(msg); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const logoutOthers = async () => {
    try { const r = await sessionService.logoutOthers(); toast.success(`Logged out ${r.logged_out} device(s)`); load(); }
    catch { toast.error("Failed"); }
  };

  const toggleSelect = (id) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const revokeSelected = async () => {
    if (selected.length === 0) { toast.error("Select sessions first"); return; }
    for (const id of selected) {
      await sessionService.revoke(id).catch(() => {});
    }
    toast.success(`Revoked ${selected.length} session(s)`);
    setSelected([]);
    load();
  };

  const allFiltered = all.filter((s) => {
    const okSearch = s.user_email.toLowerCase().includes(search.toLowerCase());
    const okStatus = statusFilter === "All" || s.status === statusFilter;
    return okSearch && okStatus;
  });

  const Badge = ({ s }) => (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS[s] || STATUS.expired}`}>
      {s.replace("_", " ")}
    </span>
  );

  if (loading) return <Spinner label="Loading..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MonitorSmartphone className="text-accent-600" size={22} />
        <h1 className="font-display text-2xl text-zinc-900 dark:text-zinc-50">Login Devices</h1>
      </div>

      {/* Admin tabs */}
      {isAdmin && (
        <div className="flex gap-2">
          <button onClick={() => setTab("mine")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab==="mine"?"bg-accent-600 text-white":"bg-zinc-100 dark:bg-zinc-800"}`}>My Devices</button>
          <button onClick={() => setTab("all")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab==="all"?"bg-accent-600 text-white":"bg-zinc-100 dark:bg-zinc-800"}`}>All Users (Admin)</button>
        </div>
      )}

      {/* MY DEVICES */}
      {tab === "mine" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={logoutOthers}><LogOut size={16} /> Log out all other devices</Button>
          </div>
          {mine.map((s) => (
            <div key={s.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {s.device_name} <Badge s={s.status} /> {s.is_trusted && <span className="ml-1 text-xs text-accent-600">✓ Trusted</span>}
                  </p>
                  <p className="text-sm text-zinc-500">{s.browser}</p>
                  <p className="text-xs text-zinc-400">IP: {s.ip} · Login: {formatDateTime(s.login_at)} · Last activity: {formatDateTime(s.last_activity_at)}</p>
                  {s.termination_reason && <p className="text-xs text-zinc-400">Reason: {s.termination_reason}</p>}
                </div>
                {s.status === "active" && (
                  <div className="flex gap-2">
                    <button onClick={() => rename(s.id)} className="text-zinc-500 hover:text-accent-600"><Pencil size={16} /></button>
                    <button onClick={() => act(sessionService.logoutOne, s.id, "Logged out")} className="text-red-500 hover:text-red-600"><LogOut size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALL USERS (ADMIN) */}
      {tab === "all" && isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input placeholder="Search by user..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <option>All</option>
              <option value="active">Active</option>
              <option value="logged_out">Logged Out</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
            {selected.length > 0 && (
              <Button onClick={revokeSelected}>
                <ShieldX size={16} /> Revoke Selected ({selected.length})
              </Button>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Browser / IP</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      {s.status === "active" && (
                        <input type="checkbox" checked={selected.includes(s.id)}
                          onChange={() => toggleSelect(s.id)} />
                      )}
                    </td>
                    <td className="px-4 py-3">{s.user_email}</td>
                    <td className="px-4 py-3 text-zinc-500">{s.device_name}<br /><span className="text-xs">{s.ip}</span></td>
                    <td className="px-4 py-3"><Badge s={s.status} />{s.termination_reason && <p className="text-xs text-zinc-400">{s.termination_reason}</p>}</td>
                    <td className="px-4 py-3">
                      {s.status === "active" ? (
                        <div className="flex gap-2">
                          <button onClick={() => act(sessionService.forceLogout, s.id, "Force logged out")} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Ban size={13} /> Force logout</button>
                          <button onClick={() => act(sessionService.revoke, s.id, "Revoked")} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><ShieldX size={13} /> Revoke</button>
                        </div>
                      ) : <span className="text-xs text-zinc-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}