
import axiosClient from "./axiosClient";

export const leaveService = {
  submit: async (payload) => (await axiosClient.post("/api/leaves", payload)).data,
  getMine: async () => (await axiosClient.get("/api/leaves/mine")).data,
  getPending: async () => (await axiosClient.get("/api/leaves/pending")).data,
  approve: async (id) => (await axiosClient.post(`/api/leaves/${id}/approve`)).data,
  reject: async (id) => (await axiosClient.post(`/api/leaves/${id}/reject`)).data,
};
