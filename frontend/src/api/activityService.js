
import axiosClient from "./axiosClient";

export const activityService = {
  getAll: async () => (await axiosClient.get("/api/activity")).data,
};
