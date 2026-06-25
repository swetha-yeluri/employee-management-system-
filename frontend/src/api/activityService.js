// Account activity API (admin view).
import axiosClient from "./axiosClient";

export const activityService = {
  getAll: async () => (await axiosClient.get("/api/activity")).data,
};
