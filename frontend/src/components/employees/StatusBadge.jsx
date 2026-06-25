// Colour-coded badge reflecting employee status.
const STYLES = {
  Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Inactive: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  "On Leave": "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STYLES[status] || STYLES.Inactive
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
