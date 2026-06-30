
import axiosClient from "./axiosClient";

export const roleRequestService = {
  async create(currentPassword, adminEmail) {
    const { data } = await axiosClient.post("/api/role-requests", {
      current_password: currentPassword,
      admin_email: adminEmail,
    });
    return data;
  },

  async getMine() {
    const { data } = await axiosClient.get("/api/role-requests/mine");
    return data;
  },

  async getPending() {
    const { data } = await axiosClient.get("/api/role-requests/pending");
    return data;
  },

  async approve(id) {
    const { data } = await axiosClient.post(`/api/role-requests/${id}/approve`);
    return data;
  },

  async reject(id) {
    const { data } = await axiosClient.post(`/api/role-requests/${id}/reject`);
    return data;
  },
};
