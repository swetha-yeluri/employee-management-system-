// Reinstatement request API (Improvement 11).
import axiosClient from "./axiosClient";

export const reinstatementService = {
  submit: async (reason) =>
    (await axiosClient.post("/api/reinstatement-requests", { reason })).data,
  getMine: async () => (await axiosClient.get("/api/reinstatement-requests/mine")).data,
  getPending: async () => (await axiosClient.get("/api/reinstatement-requests/pending")).data,
  approve: async (id) => (await axiosClient.post(`/api/reinstatement-requests/${id}/approve`)).data,
  reject: async (id) => (await axiosClient.post(`/api/reinstatement-requests/${id}/reject`)).data,
};
