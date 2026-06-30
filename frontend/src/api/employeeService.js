
import axiosClient from "./axiosClient";

export const employeeService = {
  async getAll() {
    const { data } = await axiosClient.get("/api/employees");
    return data;
  },
  async getById(id) {
    const { data } = await axiosClient.get(`/api/employees/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await axiosClient.post("/api/employees", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await axiosClient.put(`/api/employees/${id}`, payload);
    return data;
  },
  async remove(id) {
    await axiosClient.delete(`/api/employees/${id}`);
  },
  async transfer(id, departmentId) {
    const { data } = await axiosClient.post(`/api/employees/${id}/transfer`, {
      department_id: departmentId,
    });
    return data;
  },
  async getTransfers(id) {
    const { data } = await axiosClient.get(`/api/employees/${id}/transfers`);
    return data;
  },
  async getDepartments() {
    const { data } = await axiosClient.get("/api/departments");
    return data;
  },
  async getCompletion(id) {
    const { data } = await axiosClient.get(`/api/employees/${id}/completion`);
    return data;
  },
  async getAllCompletion(threshold = 100) {
    const { data } = await axiosClient.get(`/api/employees/completion/all?threshold=${threshold}`);
    return data;
  },
  async getMyCompletion() {
    const { data } = await axiosClient.get("/api/employees/completion/me");
    return data;
  },
};
