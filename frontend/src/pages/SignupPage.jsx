// Signup with role + company (multi-tenant), auto-login on success.
// ALSO handles invitation links: /signup?token=<token>
//   -> email is pre-filled from the invite (read-only), company is the inviting
//      company, role defaults to the invited role, and submitting accepts the
//      invitation (joining that company) instead of creating a brand-new company.
import { useEffect, useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, ShieldCheck, User, Building2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { invitationService } from "../api/invitationService";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/common/Button";

const ROLES = [
  { value: "user", label: "User", icon: User, hint: "Dashboard + Employees" },
  { value: "admin", label: "Admin", icon: ShieldCheck, hint: "Full access" },
];

const DEFAULT_COMPANY = "Employee-Management-System";

export default function SignupPage() {
  const { signup, acceptInvite, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const token = new URLSearchParams(window.location.search).get("token");
  const isInvite = Boolean(token);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    role: "user",                 // default role = User
    company: DEFAULT_COMPANY,     // default company
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // If an invite token is present, fetch its details and pre-fill the form.
  useEffect(() => {
    if (!isInvite) return;
    invitationService
      .verify(token)
      .then((info) =>
        setForm((p) => ({
          ...p,
          email: info.email,                         // pre-filled from the invite
          role: info.role || "user",
          company: info.company_name || DEFAULT_COMPANY,
        }))
      )
      .catch((err) =>
        setInviteError(err.response?.data?.detail || "Invalid or expired invitation")
      );
  }, [token, isInvite]);

  // Logged-in users go to the dashboard — UNLESS they opened an invite link.
  if (isAuthenticated && !isInvite) return <Navigate to="/dashboard" replace />;

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.company.trim().length < 2) next.company = "Company name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      next.email = "Enter a valid email address";
    if (form.password.length < 6)
      next.password = "Password must be at least 6 characters";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isInvite) {
        await acceptInvite(token, form.password);   // join the inviting company
        toast.success("Welcome! Your account is ready.");
      } else {
        await signup(form.email, form.password, form.role, form.company.trim());
        toast.success("Account created!");
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:bg-zinc-800";

  if (inviteError) {
    return (
      <AuthLayout heading="Invitation" subheading="">
        <div className="text-center">
          <p className="text-sm text-red-500">{inviteError}</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-accent-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading={isInvite ? "Accept your invitation" : "Create account"}
      subheading={
        isInvite
          ? "Set a password to join your team."
          : "Choose a role and set up your credentials."
      }
    >
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select role
          </span>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = form.role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  disabled={isInvite}                      // role fixed by the invite
                  onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    active
                      ? "border-accent-500 bg-accent-50 dark:bg-accent-700/15"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  <Icon size={18} className={active ? "text-accent-600" : "text-zinc-400"} />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-[11px] text-zinc-400">{r.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company</span>
          <div className="relative">
            <Building2 size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={form.company}
              onChange={update("company")}
              disabled={isInvite}                        // company fixed by the invite
              placeholder={DEFAULT_COMPANY}
              className={inputCls}
            />
          </div>
          {errors.company && <span className="mt-1 block text-xs text-red-500">{errors.company}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
          <div className="relative">
            <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              disabled={isInvite}                        // email comes from the invite
              className={inputCls}
            />
          </div>
          {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</span>
          <div className="relative">
            <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              className={inputCls}
            />
          </div>
          {errors.password && <span className="mt-1 block text-xs text-red-500">{errors.password}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm password</span>
          <div className="relative">
            <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              value={form.confirm}
              onChange={update("confirm")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className={inputCls}
            />
          </div>
          {errors.confirm && <span className="mt-1 block text-xs text-red-500">{errors.confirm}</span>}
        </label>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading
            ? isInvite ? "Joining..." : "Creating account..."
            : isInvite ? "Accept & Continue" : "Create account"}
        </Button>

        {!isInvite && (
          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent-600 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
