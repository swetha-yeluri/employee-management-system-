
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UserX, Plus, Copy, Trash2, Mail, Users2, Ban } from "lucide-react";

import { memberService } from "../api/memberService";
import { suspensionService } from "../api/suspensionService";
import { invitationService } from "../api/invitationService";
import { useAuth } from "../context/AuthContext";

import Spinner from "../components/common/Spinner";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [creating, setCreating] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);

  const doSuspend = async () => {
    if (suspendReason.trim().length < 3) { toast.error("Enter a reason"); return; }
    setSuspending(true);
    try {
      await suspensionService.suspend(suspendTarget.id, suspendReason.trim());
      toast.success("User suspended");
      setSuspendTarget(null); setSuspendReason("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Suspend failed");
    } finally {
      setSuspending(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        memberService.getAll(),
        invitationService.getPending(),
      ]);
      setMembers(m);
      setInvites(i);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deactivate = async (id) => {
    try {
      await memberService.deactivate(id);
      toast.success("User deactivated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    }
  };

  const createInvite = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setCreating(true);
    try {
      await invitationService.create(email, role);
      toast.success("Invitation created");
      setEmail("");
      setRole("user");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create invitation");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (token) => {
    const link = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard?.writeText(link);
    toast.success("Invite link copied to clipboard");
  };

  const revoke = async (id) => {
    try {
      await invitationService.revoke(id);
      toast.success("Invitation revoked");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to revoke invitation");
    }
  };

  if (loading) return <Spinner label="Loading members..." />;

  return (
    <div className="space-y-6">
      {/* ===== Active Members ===== */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <Users2 size={18} className="text-accent-600" />
          <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Members</h3>
          <Badge tone="accent">{members.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60">
              <tr>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-100">
                    {m.email}
                    {m.id === user?.id && (
                      <span className="ml-2 text-xs text-zinc-400">(you)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 capitalize text-zinc-500">{m.role}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        !m.is_active
                          ? "bg-zinc-100 text-zinc-500"
                          : m.is_suspended
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      }`}
                    >
                      {!m.is_active ? "Deactivated" : m.is_suspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {m.id !== user?.id ? (
                      <div className="flex items-center justify-end gap-1">
                        {m.is_active && !m.is_suspended && (
                          <button
                            onClick={() => setSuspendTarget(m)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-500/10"
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        )}
                        {m.is_active && (
                          <button
                            onClick={() => deactivate(m.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <UserX size={14} /> Deactivate
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Invitations ===== */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Invite a new member</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Create an invitation, then copy the link and share it. The invitee sets their own password.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createInvite()}
              placeholder="newuser@company.com"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Button onClick={createInvite} disabled={creating}>
            <Plus size={16} /> {creating ? "Creating..." : "Create Invitation"}
          </Button>
        </div>

        <h4 className="mb-2 mt-7 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Pending invitations ({invites.length})
        </h4>
        {invites.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No pending invitations.
          </p>
        ) : (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <Mail size={15} className="text-zinc-400" />
                  {inv.email}
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] capitalize text-zinc-500 dark:bg-zinc-800">
                    {inv.role}
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(inv.token)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-accent-600 transition hover:bg-accent-50 dark:hover:bg-accent-700/10"
                  >
                    <Copy size={14} /> Copy link
                  </button>
                  <button
                    onClick={() => revoke(inv.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={14} /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">
              Suspend {suspendTarget.email}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              They can still log in but all modules will be blocked until reinstated.
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              placeholder="Reason for suspension..."
              className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setSuspendTarget(null); setSuspendReason(""); }}>
                Cancel
              </Button>
              <Button onClick={doSuspend} disabled={suspending}>
                {suspending ? "Suspending..." : "Suspend"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
