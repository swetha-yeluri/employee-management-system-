// Personal notification API (in-app notices, e.g. department transfer).
import axiosClient from "./axiosClient";

export const notificationService = {
  getMine: async () => (await axiosClient.get("/api/notifications")).data,
  markRead: async () => (await axiosClient.post("/api/notifications/read")).data,
};
