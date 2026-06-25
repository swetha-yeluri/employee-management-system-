# Frontend — React + Vite

## Run

```bash
npm install
npm run dev
```

App: http://localhost:5173 (expects the backend at http://localhost:8000).
Override the API URL via `.env` → `VITE_API_BASE_URL`.

## Structure

```
src/
├── api/          # axios client + auth/employee services
├── context/      # AuthContext (session) + ThemeContext (dark mode)
├── components/
│   ├── common/   # Button, Input, Modal, Badge, Spinner, ConfirmDialog
│   ├── layout/   # Sidebar, Navbar, DashboardLayout
│   ├── employees/# Table, Card, Form, Filters, StatusBadge
│   └── dashboard/# StatCard, Charts
├── pages/        # Login, Dashboard, Employees, Departments, Attendance, Settings
├── routes/       # AppRoutes + ProtectedRoute
└── utils/        # constants
```

## Conventions
- Components → **PascalCase**
- Variables / functions → **camelCase**
- UI components never call axios directly; they go through the `api/` services.
