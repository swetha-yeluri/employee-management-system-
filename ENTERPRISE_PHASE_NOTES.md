# Enterprise Phase — Multi-Tenant, Audit Logs, Analytics

Built on top of the existing system (which already has signup roles, forgot
password, mandatory Add-Employee validation, attendance CSV download, the
Settings role-request module, and the admin approval workflow).

## IMPORTANT — reset the database first
The database schema changed (companies, audit_logs tables + company_id columns).
SQLite create_all does NOT alter existing tables, so delete the old DB once:
```bash
cd backend
rm -f employees.db
python run.py        # recreates the schema and reseeds two companies
```

---

## Task 3 — Multi-Tenant Company Management
- New `Company` model; `User` and `Employee` each carry a `company_id`.
- Signup now requires a **company** (find-or-create): `SignupPage.jsx` →
  `auth_controller.signup`.
- **Data isolation:** every employee query is filtered by the caller's
  `company_id` (`employee_controller.py`), and new employees are forced into the
  caller's company. Role requests and audit logs are company-scoped too.
- Seeded with two companies so isolation is visible:
  - **Employee-Management-System** — `admin@gmail.com` / `admin123`, `user@gmail.com` / `user123` (7 employees)
  - **Globex** — `admin@globex.com` / `admin123`, `user@globex.com` / `user123` (3 employees)
  - Primary admin sees only their company employees; Globex admin sees only Globex.

## Task 4 — Audit Logs & Activity Tracking
- New `AuditLog` model; `audit_controller.write_log()` is called on:
  Employee Created / Updated / Deleted, Role Change Requested / Approved / Rejected.
- Each entry stores user (actor), action, related target, timestamp.
- Admin-only **Audit Logs** page (`AuditLogsPage.jsx`) →
  `GET /api/audit-logs` (`audit_routes.py`), company-scoped.

## Task 5 — Analytics Dashboard APIs & KPI Widgets
- Backend aggregation: `GET /api/analytics` (`analytics_controller.py`) returns
  total employees, active employees, total departments, pending role requests,
  and chart data (by department, by role, by status) — all company-scoped.
- Frontend KPI cards: Total Employees, Active Employees, Total Departments,
  Pending Requests. Charts: Employees by Department, Employees by Role,
  Employee Status Overview (`Charts.jsx`).
- **Dashboard refresh** button reloads data without a page reload
  (`DashboardPage.jsx`).

---

## Review topics
- **Multi-tenant architecture / data isolation:** authorization derives
  `company_id` from the logged-in user (`utils/deps.py` → DB user), and every
  query filters on it, so one company can never read another's rows.
- **Audit logging workflow:** controllers call `write_log` inside the same
  action so the log and the change are recorded together.
- **Analytics API design / aggregation:** one endpoint computes all KPIs +
  chart series server-side; the UI just renders.
- **Scalability:** thin routes, logic in controllers, models per table,
  services on the frontend — each concern in its own layer.

## New endpoints
| Method | Path                  | Auth  |
|--------|-----------------------|-------|
| GET    | /api/analytics        | user  |
| GET    | /api/audit-logs       | admin |
| POST   | /api/auth/signup      | public (now takes `company`) |

## Not wired (be honest in review)
- Notification = in-app pending list + navbar bell (no email/SMTP).
- "Employees by Role" groups by job position (the Add-Employee "Role" field).
