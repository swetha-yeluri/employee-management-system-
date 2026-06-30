
import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";
import { employeeService } from "../../api/employeeService";

export default function CompletionWidget() {
  const [c, setC] = useState(null);

  useEffect(() => {
    employeeService.getMyCompletion().then(setC).catch(() => setC(null));
  }, []);

  if (!c) return null;   

  const color = c.percent === 100 ? "bg-emerald-500" : c.percent >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <UserCircle className="text-accent-600" size={20} />
        <h3 className="font-display text-lg text-zinc-900 dark:text-zinc-50">Profile Completion</h3>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-3 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-700">
          <div className={`h-3 rounded-full ${color}`} style={{ width: `${c.percent}%` }} />
        </div>
        <span className="font-display text-xl font-semibold">{c.percent}%</span>
      </div>

      {c.missing.length > 0 ? (
        <div className="mt-3">
          <p className="text-sm text-zinc-500">Missing Information:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-300">
            {c.missing.map((m) => <li key={m}>{m}</li>)}
          </ul>
          <p className="mt-3 text-sm text-accent-600">Complete your profile to improve account readiness.</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-emerald-600">Your profile is 100% complete! 🎉</p>
      )}
    </div>
  );
}