// Report downloads. The backend gates these on the admin role, so a User
// cannot fetch them; the UI also hides the button. Two layers of protection.
import axiosClient from "./axiosClient";

export const reportService = {
  async downloadAttendanceReport() {
    const response = await axiosClient.get("/api/reports/attendance", {
      responseType: "blob",
    });

    // Turn the blob into a browser download.
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
