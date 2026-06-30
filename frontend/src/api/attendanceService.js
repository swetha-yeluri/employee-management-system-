
import axiosClient from "./axiosClient";

export const attendanceService = {
  // user
  getAccess: async () => (await axiosClient.get("/api/attendance/access")).data,
  checkIn: async () => (await axiosClient.post("/api/attendance/check-in")).data,
  checkOut: async () => (await axiosClient.post("/api/attendance/check-out")).data,
  getToday: async () => (await axiosClient.get("/api/attendance/today")).data,
  getHistory: async () => (await axiosClient.get("/api/attendance/history")).data,
  getSummary: async () => (await axiosClient.get("/api/attendance/summary")).data,
  // admin
  getPendingAccess: async () => (await axiosClient.get("/api/attendance/access/pending")).data,
  approveAccess: async (id) => (await axiosClient.post(`/api/attendance/access/${id}/approve`)).data,
  rejectAccess: async (id) => (await axiosClient.post(`/api/attendance/access/${id}/reject`)).data,
};
