// Generic pill badge used for counts and tags.
export default function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    accent: "bg-accent-50 text-accent-700 dark:bg-accent-700/20 dark:text-accent-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
