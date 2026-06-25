# Enterprise Employee Management System

A complete full-stack Employee Management System built with **React (Vite)** on the
frontend and **FastAPI + SQLite** on the backend. It covers everything from the
project brief: authentication, role-based access, full CRUD, persistent storage,
and an analytics dashboard — all with a clean, scalable architecture.

---

## Tech Stack

| Layer      | Technology                                            |
|------------|-------------------------------------------------------|
| Frontend   | React 18, Vite, React Router, Axios, Tailwind CSS, Recharts, react-hot-toast, lucide-react |
| Backend    | FastAPI, SQLAlchemy, Pydantic, python-jose (JWT), passlib (bcrypt) |
| Database   | SQLite (auto-created + seeded on first run)           |

---

## Quick Start

You need **two terminals** — one for the backend, one for the frontend.

### 1. Backend (http://localhost:8000)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

API docs (Swagger UI) are available at http://localhost:8000/docs

### 2. Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Demo Accounts

The database is seeded automatically on first launch.

| Role  | Email           | Password  | Can do                              |
|-------|-----------------|-----------|-------------------------------------|
| Admin | admin@gmail.com  | admin123  | View + Add / Edit / Delete employees|
| User  | user@gmail.com   | user123   | View only (no management actions)   |

---

## How the Project Maps to the 8 Tasks

1. **Project Setup + Auth UI** — Vite/React setup, routing, login page, dashboard layout (sidebar + navbar), placeholder nav sections, dark/light toggle.
2. **Employee Dashboard UI** — employee table & card views, profile preview, status badges, search + department filter, pagination, sorting, stat cards.
3. **Backend API Setup** — FastAPI with the exact `routes / controllers / models / database / utils / config` structure, `GET /api/employees`, `GET /api/employees/{id}`, proper JSON responses.
4. **Frontend + Backend Integration** — Axios service layer, async data fetching, loading / error / empty states, toast notifications, retry handling.
5. **Database Integration** — SQLite via SQLAlchemy, Employee schema + Department relationship, data persists across restarts.
6. **Complete CRUD** — add / edit / delete with modal forms, client-side validation, confirmation dialog before delete, success/error toasts.
7. **Auth + Role-Based UI** — JWT login, protected routes, admin/user roles, conditional sidebar + action rendering, session persisted in localStorage, logout.
8. **Analytics Dashboard + Polish** — stat cards (total / active / departments / attendance %), department bar chart + status pie chart (Recharts), responsive design, clean folder structure.

---

## Architecture Notes (for the review discussion)

- **API flow**: Component → service (`api/*.js`) → axios (attaches JWT) → FastAPI route → controller (business logic) → SQLAlchemy model → SQLite.
- **Separation of concerns**: routes are thin and only handle HTTP; all logic lives in controllers; models define the schema; schemas validate I/O.
- **Auth flow**: login returns a JWT → stored in localStorage → axios interceptor attaches it to every request → backend `get_current_user`/`require_admin` dependencies guard endpoints.
- **Data persistence**: tables are created on startup and seeded only when empty, so restarting the server keeps your data.

---

## Project Structure

```
employee-management-system/
├── backend/      # FastAPI + SQLite
└── frontend/     # React + Vite
```

See `backend/README.md` and `frontend/README.md` for per-side detail.

---

## Enterprise Improvements (Phase 2)

Built on top of the base system:

### 1. Role-Based Signup & Access Control
- **Signup page** with a role selector (Admin / User). New accounts auto-login.
- Access rules enforced in two layers:
  - **User role** → can only reach **Dashboard** and **Employees**.
  - **Admin role** → full access to all modules (Departments, Attendance, Settings) and all CRUD/report actions.
- Frontend hides what a User can't use (`adminOnly` nav items + `ProtectedRoute adminOnly`); the **backend** independently enforces it (`require_admin`), so a User can't bypass the UI by calling the API directly.

### 2. Forgot Password
- Dedicated `/forgot-password` page with email + new-password + confirm fields and full validation.
- Backend `POST /api/auth/reset-password` verifies the email exists and updates the stored (hashed) password.
- *Production note:* a real app would email a one-time reset token rather than accept a new password directly — this direct flow is kept simple for the project.

### 3. Mandatory Validation — Add Employee
- **Name, Email, Role, Department** are all required.
- The **"Add Employee" button stays disabled** until every required field is valid.
- Inline validation messages appear per field once touched.

### 4. Attendance Report Download (Admin only)
- `GET /api/reports/attendance` streams a CSV, gated by `require_admin`.
- The download button only renders for admins, and the Attendance tab itself is admin-only — so a User can neither see nor trigger it.

### Security note on self-signup roles
Letting anyone pick "Admin" at signup is intentionally simple for this learning project. In production you would instead create admin accounts manually, use invite codes, or require an existing admin to approve role upgrades. Worth raising in the review discussion.

### New / changed endpoints
| Method | Path                       | Auth   |
|--------|----------------------------|--------|
| POST   | /api/auth/signup           | public |
| POST   | /api/auth/reset-password   | public |
| GET    | /api/reports/attendance    | admin  |

---

## Role-Change Request Workflow (Phase 3)

A request/approval pipeline that lets a User ask to become an Admin.

### User side (Settings tab — User role only)
- A **Settings** tab now appears for Users (not Admins).
- To request promotion, the User must **verify their current password** and **name the admin** who should review it.
- They can see the status of their request (pending / approved / rejected). One pending request at a time.

### Admin side (Requests tab — Admin role only)
- A **Requests** tab lists role requests addressed to that admin (the "notification"); a bell badge in the navbar shows the pending count.
- The admin can **Approve** (which promotes the user to admin) or **Reject**.
- Only the admin named in the request can act on it.

### Why Admins can't request a switch
The request form is User-only — both in the UI (Settings is `userOnly`) and on the backend (`create_request` returns 403 for admin accounts). Admins instead get the approval view.

### Session management note (for review)
Authorisation is re-checked against the database on **every** request (`get_current_user` loads the live user record), so the moment an approval flips a user's role, the backend treats them as an admin — the old JWT doesn't need re-issuing. The frontend caches the role in localStorage for UI gating, so it calls `/api/auth/me` (via `refreshUser`) to pick up the new role without a full re-login.

### How to test
1. Log in as `user@gmail.com` / `user123` → go to **Settings** → submit a request naming `admin@gmail.com` (enter password `user123`).
2. Log in as `admin@gmail.com` / `admin123` → see the bell badge → open **Requests** → **Approve**.
3. Back as the user, revisit **Settings** (or re-login) → role is now Admin and the full nav appears.

### New endpoints
| Method | Path                               | Auth   |
|--------|------------------------------------|--------|
| POST   | /api/role-requests                 | user   |
| GET    | /api/role-requests/mine            | user   |
| GET    | /api/role-requests/pending         | admin  |
| POST   | /api/role-requests/{id}/approve    | admin  |
| POST   | /api/role-requests/{id}/reject     | admin  |

### Bug fix in this phase — root-cause analysis
**Symptom:** backend crashed on startup with `password cannot be longer than 72 bytes`.
**Root cause:** `passlib 1.7.4` runs an internal self-test against `bcrypt` at init; the newly released `bcrypt 5.0.0` changed that path to raise instead of truncating, breaking passlib's startup.
**Fix:** pinned `bcrypt==4.0.1` in `requirements.txt`. **Lesson:** pin dependency versions so a transitive upgrade can't silently break the build.

*Production note:* the in-app pending list stands in for a real notification. A production build would also email the reviewing admin (SMTP / a service like SendGrid) when a request arrives.

---

## Improvement 6 — User Invitations & Member Management
Admin-only **Members** module: invite users (copy invite link), view members,
revoke pending invites, and **deactivate** users. Deactivated users can still log
in but only see an **Account Deactivated** page, where they can submit a
**reactivation request** to the admin who deactivated them. That admin reviews it
under **Reactivations** (approve restores access per role). All seven lifecycle
events are written to the **Audit Logs**. New endpoints: `/api/invitations`,
`/api/members`, `/api/reactivation-requests` (+ public
`/api/invitations/verify/{token}` and `/api/invitations/accept`).

**Note:** schema changed (new tables + user columns) — delete `backend/employees.db`
once and restart so it recreates.

---

## Improvement 7 — Attendance Management Module
Every User sees an **Attendance** tab. On first open, access is NOT granted: an
**Attendance Access Request** is auto-created (with timestamp) and the user sees
an "Attendance Access Pending" screen. All company admins see it in the
**notification bell -> Settings** and can Approve/Reject. Once approved, the user
can **Check In / Check Out**, view today's status, total working hours, and
recent history, and submit **Leave Requests** (type, dates, reason) which admins
approve/reject under Settings. Admins keep the attendance overview + CSV. All
data is company-scoped; eight events are written to **Audit Logs**.
New endpoints: `/api/attendance/*` and `/api/leaves/*`.

**Note:** schema changed (new tables + a user column) — delete
`backend/employees.db` once and restart so it recreates.

---

## Employee Transfer Between Departments
Admins can move an employee to a different department from the Employees table
(the transfer icon opens a department picker, e.g. HR -> Finance). On transfer
the system: (1) writes an **audit log** entry (`Employee Transferred`, with the
from -> to departments), (2) **notifies the employee** in-app — if a user account
matches the employee's email, a personal notification appears in their
notification bell, and (3) re-evaluates permissions (this system's permissions
are role-based, not department-based, so a transfer does not change a user's
role/access — the hook is in place if department-driven rules are ever added).
New endpoints: `POST /api/employees/{id}/transfer` and `/api/notifications`.

**Note:** schema changed (new notifications table) — delete
`backend/employees.db` once and restart so it recreates.

---

## Improvement 8 & 9 — Transfer History + Account Activity Tracking
**8 (Transfer history):** every department transfer is now also stored in a
`department_transfers` table; the transfer dialog shows that employee's transfer
history (from -> to + date). Notification + audit + permission hook stay as before.

**9 (Activity tracking):** on login the backend records the timestamp, browser
(user-agent) and IP, and flags a **new device** or **new IP** vs the user's
history; on logout it records the logout timestamp. Admins get an **Activity**
page (company-scoped) showing each user's name, email, last login, last logout,
browser and IP, with "New device" / "New IP" highlights. Audit events: User
Login, User Logout, New Device Detected, New IP Address Detected.
New endpoints: `POST /api/auth/logout`, `GET /api/activity`,
`GET /api/employees/{id}/transfers`.

**Note:** schema changed (new tables + user columns) — delete
`backend/employees.db` once and restart so it recreates.

---

## Improvement 10 — Data Export Center
Admin-only **Data Export Center** tab. Export **Employees, Attendance, Leave
Requests, Audit Logs, Notifications, Analytics** as **CSV, Excel, or PDF** (each
company-scoped). Every export is recorded in **Export History** (who exported,
what data, which format, when). New endpoints: `GET /api/exports/{type}?fmt=...`
and `GET /api/exports/history`. Needs `openpyxl` + `fpdf2` (in requirements.txt).

**Note:** schema changed (export_history table) — delete `backend/employees.db`
once and restart (the .bat/start scripts do this automatically).

---

## Improvement 11 — Employee Suspension & Reinstatement
Admins can **suspend** any user OR admin in their company (with a reason).
A suspended account can still **log in** but every protected module is blocked by
the backend (`require_active_user` rejects suspended users → no create/update/
delete/requests/export/dashboards, even via direct URL or API). The user sees a
dedicated **Account Suspended** page showing status, suspension date, reason, and
who suspended them, plus a **reinstatement request** form with status tracking.
The suspending admin is notified; any company admin can approve/reject from the
bell or Settings. On approval the user goes **Suspended → Active** with the same
role/access (no recreation). States: Active / Suspended / Deactivated. Audit
events: User Suspended, Admin Suspended, Reinstatement Request Submitted,
Reinstatement Approved, Reinstatement Rejected, User Reinstated.
New endpoints: `/api/suspension/*`, `/api/reinstatement-requests/*`.

**Note:** schema changed (suspension columns + reinstatement table) — delete
`backend/employees.db` once and restart (start.bat does this automatically).
