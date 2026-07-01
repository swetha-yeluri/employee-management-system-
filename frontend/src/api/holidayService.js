
import axiosClient from "./axiosClient";

export const holidayService = {
  getAll: async () => (await axiosClient.get("/api/holidays")).data,
  create: async (data) => (await axiosClient.post("/api/holidays", data)).data,
  update: async (id, data) => (await axiosClient.put(`/api/holidays/${id}`, data)).data,
  remove: async (id) => (await axiosClient.delete(`/api/holidays/${id}`)).data,
};