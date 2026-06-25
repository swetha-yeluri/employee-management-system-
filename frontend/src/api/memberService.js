// Member API (admin only).
import axiosClient from "./axiosClient";

export const memberService = {
  getAll: async () => (await axiosClient.get("/api/members")).data,
  deactivate: async (id) =>
    (await axiosClient.post(`/api/members/${id}/deactivate`)).data,
};
