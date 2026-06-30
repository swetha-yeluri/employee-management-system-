
export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-accent-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
