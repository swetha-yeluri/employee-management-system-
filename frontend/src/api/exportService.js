
import axiosClient from "./axiosClient";

const EXT = { csv: "csv", excel: "xlsx", pdf: "pdf" };

export const exportService = {
  download: async (dataType, fmt) => {
    try {
      const res = await axiosClient.get(`/api/exports/${dataType}?fmt=${fmt}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataType}.${EXT[fmt] || fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // error bodies come back as a blob; read the real message out of it
      let detail = "Export failed";
      try {
        const text = await err.response?.data?.text?.();
        if (text) detail = JSON.parse(text).detail || detail;
      } catch {
        /* ignore */
      }
      const e = new Error(detail);
      e.response = { data: { detail } };
      throw e;
    }
  },
  getHistory: async () => (await axiosClient.get("/api/exports/history")).data,
};
