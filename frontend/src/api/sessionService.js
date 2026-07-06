
import axiosClient from "./axiosClient";

export const sessionService = {
  getMine: async () => (await axiosClient.get("/api/sessions/mine")).data,
  rename: async (id, name) => (await axiosClient.put(`/api/sessions/${id}/rename`, { device_name: name })).data,
  logoutOne: async (id) => (await axiosClient.post(`/api/sessions/${id}/logout`)).data,
  logoutOthers: async () => (await axiosClient.post("/api/sessions/logout-others")).data,
  getAll: async () => (await axiosClient.get("/api/sessions/all")).data,
  forceLogout: async (id) => (await axiosClient.post(`/api/sessions/${id}/force-logout`)).data,
  revoke: async (id) => (await axiosClient.post(`/api/sessions/${id}/revoke`)).data,
};