
import axiosClient from "./axiosClient";

export const skillService = {
  // skills
  getMySkills: async () => (await axiosClient.get("/api/skills/mine")).data,
  addSkill: async (data) => (await axiosClient.post("/api/skills", data)).data,
  updateSkill: async (id, data) => (await axiosClient.put(`/api/skills/${id}`, data)).data,
  deleteSkill: async (id) => (await axiosClient.delete(`/api/skills/${id}`)).data,

  // certifications
  getMyCerts: async () => (await axiosClient.get("/api/certifications/mine")).data,
  addCert: async (data) => (await axiosClient.post("/api/certifications", data)).data,
  updateCert: async (id, data) => (await axiosClient.put(`/api/certifications/${id}`, data)).data,
  deleteCert: async (id) => (await axiosClient.delete(`/api/certifications/${id}`)).data,
  uploadDocument: async (certId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return (await axiosClient.post(`/api/certifications/${certId}/document`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  },

  // admin
  adminCompetencies: async (params) =>
    (await axiosClient.get("/api/admin/competencies", { params })).data,
};