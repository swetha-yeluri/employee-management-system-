// Suspension API (Improvement 11).
import axiosClient from "./axiosClient";

export const suspensionService = {
  mySuspension: async () => (await axiosClient.get("/api/suspension/me")).data,
  suspend: async (userId, reason) =>
    (await axiosClient.post(`/api/suspension/suspend/${userId}`, { reason })).data,
};
