// Auth-related API calls, isolated from UI components.
import axiosClient from "./axiosClient";

export const authService = {
  async login(email, password) {
    const { data } = await axiosClient.post("/api/auth/login", { email, password });
    return data;
  },

  async signup(email, password, role, company) {
    const { data } = await axiosClient.post("/api/auth/signup", {
      email,
      password,
      role,
      company,
    });
    return data;
  },

  async resetPassword(email, newPassword) {
    const { data } = await axiosClient.post("/api/auth/reset-password", {
      email,
      new_password: newPassword,
    });
    return data;
  },

  async getProfile() {
    const { data } = await axiosClient.get("/api/auth/me");
    return data;
  },

  async logout() {
    // best-effort: records last logout + activity on the backend
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {
      /* token may already be gone; ignore */
    }
  },
};
