// Labelled input with inline error message support.
export default function Input({ label, error, className = "", ...rest }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 dark:bg-zinc-900 dark:text-zinc-100 ${
          error
            ? "border-red-400"
            : "border-zinc-200 dark:border-zinc-700"
        } ${className}`}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
