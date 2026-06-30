
const VARIANTS = {
  primary:
    "bg-accent-600 hover:bg-accent-700 text-white shadow-soft disabled:opacity-50",
  secondary:
    "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost:
    "bg-transparent hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800",
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
