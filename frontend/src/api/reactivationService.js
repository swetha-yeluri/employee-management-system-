
import axiosClient from "./axiosClient";

export const reactivationService = {
  submit: async () => (await axiosClient.post("/api/reactivation-requests")).data,
  getMine: async () => (await axiosClient.get("/api/reactivation-requests/mine")).data,
  getPending: async () =>
    (await axiosClient.get("/api/reactivation-requests/pending")).data,
  approve: async (id) =>
    (await axiosClient.post(`/api/reactivation-requests/${id}/approve`)).data,
  reject: async (id) =>
    (await axiosClient.post(`/api/reactivation-requests/${id}/reject`)).data,
};
