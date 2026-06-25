// Accessible modal shell used for the employee create/edit forms (Task 6).
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-fade-up relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
