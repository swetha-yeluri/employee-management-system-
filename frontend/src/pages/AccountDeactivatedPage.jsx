
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { ShieldOff, Clock, CheckCircle2, XCircle, LogOut } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { reactivationService } from "../api/reactivationService";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";

const META = {
  pending: { icon: Clock, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/15", label: "Pending review" },
  approved: { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15", label: "Approved" },
  rejected: { icon: XCircle, tone: "text-red-500 bg-red-50 dark:bg-red-500/15", label: "Rejected" },
};

export default function AccountDeactivatedPage() {
  const { user, logout, refreshUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reactivated, setReactivated] = useState(false);

  const load = () =>
    reactivationService
      .getMine()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    refreshUser()
      .then((u) => {
        if (u?.is_active) setReactivated(true);
      })
      .catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reactivated) return <Navigate to="/dashboard" replace />;

  const submit = async () => {
    setSubmitting(true);
    try {
      await reactivationService.submit();
      toast.success("Reactivation request submitted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = requests.some((r) => r.status === "pending");

  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-6 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/15">
          <ShieldOff size={28} />
        </div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Account Deactivated
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Your account ({user?.email}) has been deactivated by an administrator.
          You can request reactivation below.
        </p>

        {loading ? (
          <div className="mt-6">
            <Spinner label="Checking status..." />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {requests.length > 0 && (
              <div className="space-y-2">
                {requests.map((r) => {
                  const m = META[r.status] || META.pending;
                  const Icon = m.icon;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${m.tone}`}
                    >
                      <Icon size={15} /> {m.label}
                    </div>
                  );
                })}
              </div>
            )}

            {!hasPending && (
              <Button onClick={submit} disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Request Reactivation"}
              </Button>
            )}

            <button
              onClick={logout}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
