
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, CheckCircle2 } from "lucide-react";

import { authService } from "../api/authService";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/common/Button";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      next.email = "Enter a valid email address";
    if (form.newPassword.length < 6)
      next.newPassword = "Password must be at least 6 characters";
    if (form.confirm !== form.newPassword)
      next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.resetPassword(form.email, form.newPassword);
      setDone(true);
      toast.success("Password updated");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Reset password"
      subheading="Enter your email and choose a new password."
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-8 text-center dark:border-accent-700/30 dark:bg-accent-700/10">
          <CheckCircle2 className="text-accent-600" size={36} />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Password updated. Redirecting to sign in...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </span>
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              New password
            </span>
            <div className="relative">
              <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={form.newPassword}
                onChange={update("newPassword")}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            {errors.newPassword && <span className="mt-1 block text-xs text-red-500">{errors.newPassword}</span>}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Confirm new password
            </span>
            <div className="relative">
              <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={form.confirm}
                onChange={update("confirm")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            {errors.confirm && <span className="mt-1 block text-xs text-red-500">{errors.confirm}</span>}
          </label>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update password"}
          </Button>

          <p className="text-center text-sm text-zinc-500">
            Remembered it?{" "}
            <Link to="/login" className="font-semibold text-accent-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
