
import axiosClient from "./axiosClient";

export const analyticsService = {
  async get() {
    const { data } = await axiosClient.get("/api/analytics");
    return data;
  },
};
