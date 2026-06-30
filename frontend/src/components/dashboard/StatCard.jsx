
export default function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accent}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="font-display text-2xl font-bold text-slate-800 dark:text-slate-50">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
