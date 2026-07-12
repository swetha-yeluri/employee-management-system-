
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import AccountDeactivatedPage from "../pages/AccountDeactivatedPage";
import AccountSuspendedPage from "../pages/AccountSuspendedPage";
import DashboardPage from "../pages/DashboardPage";
import EmployeesPage from "../pages/EmployeesPage";
import DepartmentsPage from "../pages/DepartmentsPage";
import AttendancePage from "../pages/AttendancePage";
import MembersPage from "../pages/MembersPage";
import AuditLogsPage from "../pages/AuditLogsPage";
import ActivityPage from "../pages/ActivityPage";
import ExportCenterPage from "../pages/ExportCenterPage";
import SettingsPage from "../pages/SettingsPage";
import ProfileCompletionPage from "../pages/ProfileCompletionPage";
import HolidaysPage from "../pages/HolidaysPage";
import LoginDevicesPage from "../pages/LoginDevicesPage";
import SkillsPage from "../pages/SkillsPage";
import AdminCompetenciesPage from "../pages/AdminCompetenciesPage";


export default function AppRoutes() {
  return (
    <Routes>
      {/* Public (signup also handles invite links: /signup?token=...) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Logged-in but deactivated: standalone page (no app shell) */}
      <Route
        path="/account-suspended"
        element={
          <ProtectedRoute allowSuspended>
            <AccountSuspendedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-deactivated"
        element={
          <ProtectedRoute allowInactive>
            <AccountDeactivatedPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated app shell */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />

        {/* Admin-only modules */}
        <Route path="/departments" element={<ProtectedRoute adminOnly><DepartmentsPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/members" element={<ProtectedRoute adminOnly><MembersPage /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute adminOnly><ActivityPage /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute adminOnly><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/data-export" element={<ProtectedRoute adminOnly><ExportCenterPage /></ProtectedRoute>} />
        <Route path="/profile-completion" element={<ProtectedRoute adminOnly><ProfileCompletionPage /></ProtectedRoute>} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/login-devices" element={<LoginDevicesPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/competencies" element={<ProtectedRoute adminOnly><AdminCompetenciesPage /></ProtectedRoute>} />

        {/* Settings: available to everyone (admins manage requests here) */}
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

     

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
