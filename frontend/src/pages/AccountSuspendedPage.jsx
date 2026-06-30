
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldAlert, LogOut, Send } from "lucide-react";

import { suspensionService } from "../api/suspensionService";
import { reinstatementService } from "../api/reinstatementService";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/datetime";

const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

export default function AccountSuspendedPage() {
  const { logout } = useAuth();
  const [info, setInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [s, mine] = await Promise.all([
      suspensionService.mySuspension().catch(() => null),
      reinstatementService.getMine().catch(() => []),
    ]);
    setInfo(s);
    setRequests(mine);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (reason.trim().length < 3) {
      toast.error("Please enter a reason");
      return;
    }
    setSubmitting(true);
    try {
      await reinstatementService.submit(reason.trim());
      toast.success("Reinstatement request submitted");
      setReason("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = requests.some((r) => r.status === "pending");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15">
          <ShieldAlert size={30} />
        </div>
        <h1 className="text-center font-display text-2xl text-zinc-900 dark:text-zinc-50">
          Account Suspended
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Your access to all modules has been blocked by an administrator.
        </p>

        {/* Suspension details */}
        <div className="mt-5 space-y-2 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-800/60">
          <div className="flex justify-between"><span className="text-zinc-500">Status</span>
            <span className="font-semibold text-red-600">{info?.status || "Suspended"}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Suspension date</span>
            <span className="font-medium">{formatDateTime(info?.suspended_at)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Suspended by</span>
            <span className="font-medium">{info?.suspended_by || "—"}</span></div>
          <div className="flex flex-col gap-1"><span className="text-zinc-500">Reason</span>
            <span className="font-medium">{info?.suspension_reason || "—"}</span></div>
        </div>

        {/* Reinstatement request */}
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Request reinstatement
          </h2>
          {hasPending ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              Your reinstatement request is pending admin review.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain why your access should be restored..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-60"
              >
                <Send size={16} /> {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          )}
        </div>

        {/* Request history / tracking */}
        {requests.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              My requests
            </h3>
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                  <span className="truncate text-zinc-600 dark:text-zinc-300">{r.reason}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}
