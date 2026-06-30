
import axiosClient from "./axiosClient";

export const auditService = {
  async getLogs() {
    const { data } = await axiosClient.get("/api/audit-logs");
    return data;
  },
};
