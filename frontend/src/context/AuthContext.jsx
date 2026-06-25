// Holds the authenticated user + token and exposes login/signup/logout +
// refreshUser. Session persisted to localStorage.
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../api/authService";
import { invitationService } from "../api/invitationService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ems_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const persistSession = (data) => {
    localStorage.setItem("ems_token", data.access_token);
    localStorage.setItem("ems_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    return persistSession(data);
  };

  const signup = async (email, password, role, company) => {
    const data = await authService.signup(email, password, role, company);
    return persistSession(data);
  };

  const acceptInvite = async (token, password) => {
    const data = await invitationService.accept(token, password);
    return persistSession(data); // auto-login the invited user
  };

  const logout = async () => {
    await authService.logout(); // records last logout + activity (best-effort)
    localStorage.removeItem("ems_token");
    localStorage.removeItem("ems_user");
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await authService.getProfile();
    localStorage.setItem("ems_user", JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    acceptInvite,
    logout,
    refreshUser,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
