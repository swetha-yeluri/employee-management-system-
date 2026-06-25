// Guards authenticated routes. Redirects to /login when not signed in,
// to /account-deactivated when the account is deactivated, and enforces
// admin-only / user-only access.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
  userOnly = false,
  allowInactive = false,
  allowSuspended = false,
}) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isActive = user?.is_active !== false;

  // Deactivated users can ONLY see the account-deactivated page.
  if (!isActive && !allowInactive) {
    return <Navigate to="/account-deactivated" replace />;
  }
  // Active users should not sit on the deactivated page.
  if (isActive && allowInactive) {
    return <Navigate to="/dashboard" replace />;
  }

  // Suspended users (still active) can ONLY see the account-suspended page.
  const isSuspended = user?.is_suspended === true;
  if (isSuspended && !allowSuspended) {
    return <Navigate to="/account-suspended" replace />;
  }
  if (!isSuspended && allowSuspended) {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (userOnly && isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
