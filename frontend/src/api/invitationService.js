
import axiosClient from "./axiosClient";

export const invitationService = {
  create: async (email, role) =>
    (await axiosClient.post("/api/invitations", { email, role })).data,
  getPending: async () => (await axiosClient.get("/api/invitations")).data,
  revoke: async (id) =>
    (await axiosClient.post(`/api/invitations/${id}/revoke`)).data,
  verify: async (token) =>
    (await axiosClient.get(`/api/invitations/verify/${token}`)).data,
  accept: async (token, password) =>
    (await axiosClient.post("/api/invitations/accept", { token, password })).data,
};
