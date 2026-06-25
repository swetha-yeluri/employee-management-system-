# Employee Management System — Full Code & Flow Explanation

A complete, beginner-friendly walkthrough of the project: how the frontend,
backend, and database work together, the Signup / Login / Forgot-Password
flows explained step-by-step (with the actual code line-by-line), and a
reference for every file.

---

# PART 1 — The Big Picture (zero-knowledge friendly)

A full-stack app has **three layers**. A simple restaurant analogy:

| Layer | In this project | Restaurant analogy | Job |
|-------|-----------------|--------------------|-----|
| **Frontend** | React (the website you see in the browser) | The waiter + menu | Shows screens, takes input, sends requests |
| **Backend** | FastAPI (Python server) | The kitchen | Receives requests, runs the rules, talks to the DB |
| **Database** | SQLite | The store room | Stores data permanently (users, employees, …) |

The frontend **never** touches the database directly. It always asks the
backend, and the backend talks to the database. This separation is why the app
is secure and maintainable.

They run as **two separate programs**:
- Backend runs at `http://localhost:8000`
- Frontend runs at `http://localhost:5173`
- They talk over HTTP using **JSON** (a text format for data).

---

# PART 2 — Tech Stack

**Frontend:** React (UI library), Vite (dev server/build), React Router
(page navigation), Axios (sends HTTP requests), Tailwind CSS (styling),
Recharts (charts), lucide-react (icons), react-hot-toast (popups).

**Backend:** FastAPI (web framework), SQLAlchemy (talks to the DB using Python
objects instead of raw SQL), Pydantic (validates incoming/outgoing data),
python-jose (JWT tokens), passlib + bcrypt (password hashing), Uvicorn (runs
the server).

**Database:** SQLite — a single file (`employees.db`) that stores all tables.

---

# PART 3 — How One Request Travels (the universal flow)

Every action in the app follows the same path. Memorise this — your mentor will
ask it:

```
[1] USER clicks a button on a PAGE  (React component, e.g. LoginPage.jsx)
        |
        v
[2] PAGE calls a SERVICE function   (src/api/*.js, e.g. authService.login)
        |
        v
[3] SERVICE uses AXIOS to send an HTTP request   (src/api/axiosClient.js)
        |  (axios attaches the JWT token automatically)
        v
====================  network: http://localhost:8000  ====================
        |
        v
[4] ROUTE receives it on the backend   (backend/app/routes/*.py)
        |  (FastAPI validates the body using a Pydantic SCHEMA)
        v
[5] ROUTE calls a CONTROLLER          (backend/app/controllers/*.py)
        |  (all the real logic + rules live here)
        v
[6] CONTROLLER uses a MODEL to read/write the DATABASE  (SQLAlchemy)
        |
        v
[7] DATABASE (SQLite) returns rows -> CONTROLLER -> ROUTE -> JSON response
        |
        v
====================  back across the network  ====================
        |
        v
[8] SERVICE returns the data -> PAGE updates the screen (React state)
```

**Layer responsibilities (separation of concerns):**
- **Routes** = the "front door". They only receive the request and hand it off. They stay thin.
- **Controllers** = the "brain". All business rules and decisions live here.
- **Models** = the "shape of the data" / the database tables.
- **Schemas** = the "contract". They validate what comes in and shape what goes out.
- **Services (frontend)** = the only place that talks to the backend, so UI components stay clean.

---

# PART 4 — Folder Structure

## Backend (`backend/`)
```
backend/
├── app/
│   ├── main.py              # Starts the app, registers all routes, creates tables, seeds data
│   ├── config/
│   │   └── settings.py      # All settings: DB path, JWT secret, token expiry, CORS
│   ├── database/
│   │   ├── connection.py    # DB engine + session + get_db() dependency
│   │   └── seed.py          # Inserts starting data (companies, users, employees)
│   ├── models/              # Database TABLES (SQLAlchemy classes)
│   │   ├── company_model.py
│   │   ├── user_model.py
│   │   ├── employee_model.py
│   │   ├── department_model.py
│   │   ├── role_request_model.py
│   │   └── audit_log_model.py
│   ├── schemas/             # Pydantic validation (request/response shapes)
│   │   ├── auth_schema.py
│   │   ├── employee_schema.py
│   │   ├── role_request_schema.py
│   │   ├── analytics_schema.py
│   │   └── audit_log_schema.py
│   ├── controllers/         # Business logic
│   │   ├── auth_controller.py
│   │   ├── employee_controller.py
│   │   ├── role_request_controller.py
│   │   ├── analytics_controller.py
│   │   ├── report_controller.py
│   │   └── audit_controller.py
│   ├── routes/              # API endpoints (URLs)
│   │   ├── auth_routes.py
│   │   ├── employee_routes.py
│   │   ├── department_routes.py
│   │   ├── role_request_routes.py
│   │   ├── analytics_routes.py
│   │   ├── report_routes.py
│   │   └── audit_routes.py
│   └── utils/
│       ├── security.py      # Password hashing + JWT create/decode
│       └── deps.py          # get_current_user / require_admin (route guards)
├── requirements.txt         # Python dependencies
└── run.py                   # Entry point: python run.py
```

## Frontend (`frontend/src/`)
```
src/
├── main.jsx                 # App entry: wraps app in providers (Auth, Theme, Router)
├── App.jsx                  # Renders the route table
├── index.css                # Global styles
├── api/                     # The only files that talk to the backend
│   ├── axiosClient.js       # Axios instance + token attach + 401 handling
│   ├── authService.js       # login / signup / resetPassword / getProfile
│   ├── employeeService.js   # employee CRUD + departments
│   ├── analyticsService.js  # dashboard KPIs
│   ├── auditService.js      # audit logs
│   └── roleRequestService.js# role-change requests
├── context/
│   ├── AuthContext.jsx      # Stores the logged-in user + token (app-wide)
│   └── ThemeContext.jsx     # Dark/light theme
├── routes/
│   ├── AppRoutes.jsx        # Which URL shows which page
│   └── ProtectedRoute.jsx   # Blocks pages if not logged in / wrong role
├── components/
│   ├── common/              # Button, Input, Modal, Badge, Spinner, ConfirmDialog
│   ├── layout/              # Sidebar, Navbar, DashboardLayout, AuthLayout
│   ├── employees/           # EmployeeTable, EmployeeCard, EmployeeForm, EmployeeFilters, StatusBadge
│   └── dashboard/           # StatCard, Charts
├── pages/                   # Full screens
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── ForgotPasswordPage.jsx
│   ├── DashboardPage.jsx
│   ├── EmployeesPage.jsx
│   ├── DepartmentsPage.jsx
│   ├── AttendancePage.jsx
│   ├── RequestsPage.jsx
│   ├── AuditLogsPage.jsx
│   └── SettingsPage.jsx
└── utils/
    └── constants.js         # Sidebar nav items + employee statuses
```

---

# PART 5 — The Database (SQLite)

Six tables. Each is defined by a **model** file.

| Table | Important columns | Meaning |
|-------|-------------------|---------|
| `companies` | id, name | Each tenant/company |
| `users` | id, email, hashed_password, role, company_id | Login accounts (admin/user) |
| `employees` | id, name, email, position, status, department_id, company_id | Employee records |
| `departments` | id, name | Department list |
| `role_requests` | id, company_id, requester_email, admin_email, status, created_at | User→Admin requests |
| `audit_logs` | id, company_id, user_name, action, target, timestamp | Activity history |

**Relationships:**
- A company **has many** users and employees (`company_id` links them).
- A department **has many** employees (`department_id`).
- `company_id` everywhere is what makes **multi-tenant isolation** work: every
  query filters by it, so one company can't see another's data.

**Persistence:** the data lives in the file `backend/employees.db`. It survives
server restarts. On first run, `seed.py` fills it with starting data.

---

# PART 6 — Authentication Flows (Output → Code → Line-by-Line)

This part covers exactly what your mentor asked: **Signup, Login, Forgot
Password** — what you see on screen, and the full code path for each.

Two helper files are used by all three flows, so understand these first.

## 6.0a — `src/api/axiosClient.js` (the messenger)

Every backend call goes through this one axios instance.

```js
1  // Central axios instance...
3  import axios from "axios";
5  const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
7  const axiosClient = axios.create({
8    baseURL,
9    headers: { "Content-Type": "application/json" },
10 });
12 axiosClient.interceptors.request.use((config) => {
13   const token = localStorage.getItem("ems_token");
14   if (token) {
15     config.headers.Authorization = `Bearer ${token}`;
16   }
17   return config;
18 });
20 axiosClient.interceptors.response.use(
21   (response) => response,
22   (error) => {
23     if (error.response?.status === 401) {
24       localStorage.removeItem("ems_token");
25       localStorage.removeItem("ems_user");
26       if (window.location.pathname !== "/login") {
27         window.location.href = "/login";
28       }
29     }
30     return Promise.reject(error);
31   }
32 );
34 export default axiosClient;
```

- **Line 5:** read the backend URL from the `.env` file; if missing, default to localhost:8000.
- **Line 7-10:** create a reusable axios object. `baseURL` means we can write `/api/auth/login` instead of the full URL every time.
- **Line 12-18 (request interceptor):** runs **before every request leaves**. It reads the saved JWT token from the browser's localStorage (line 13) and, if present, adds it to the `Authorization` header as `Bearer <token>` (line 15). This is how the backend knows who you are on every call — you don't attach it manually anywhere else.
- **Line 20-32 (response interceptor):** runs on **every response**. If the backend replies `401 Unauthorized` (token missing/expired), it clears the saved login (lines 24-25) and sends the user back to `/login` (line 27). This is automatic session expiry handling.

## 6.0b — `src/context/AuthContext.jsx` (app-wide memory of who is logged in)

React Context = a value any component can read without passing props down
manually. This stores the current user.

```jsx
8  export function AuthProvider({ children }) {
9    const [user, setUser] = useState(null);
10   const [loading, setLoading] = useState(true);
12   useEffect(() => {
13     const stored = localStorage.getItem("ems_user");
14     if (stored) setUser(JSON.parse(stored));
15     setLoading(false);
16   }, []);
18   const persistSession = (data) => {
19     localStorage.setItem("ems_token", data.access_token);
20     localStorage.setItem("ems_user", JSON.stringify(data.user));
21     setUser(data.user);
22     return data.user;
23   };
25   const login = async (email, password) => {
26     const data = await authService.login(email, password);
27     return persistSession(data);
28   };
30   const signup = async (email, password, role, company) => {
31     const data = await authService.signup(email, password, role, company);
32     return persistSession(data);
33   };
35   const logout = () => { ...clear storage + setUser(null)... };
48   const value = { user, loading, login, signup, logout, refreshUser,
55     isAuthenticated: Boolean(user),
56     isAdmin: user?.role === "admin" };
```

- **Line 9:** `user` holds the logged-in person (or `null`). `setUser` updates it and re-renders the app.
- **Line 12-16:** when the app first loads, check localStorage for a saved user. If found, restore it. **This is why a page refresh keeps you logged in** (session persistence).
- **Line 18-23 `persistSession`:** the shared "save login" step — stores the token + user in localStorage and in React state.
- **Line 25-28 `login` / Line 30-33 `signup`:** call the service, then persist the returned session.
- **Line 55:** `isAuthenticated` is simply "is there a user?".
- **Line 56:** `isAdmin` is true only if the user's role is "admin". The whole UI uses this to show/hide admin features.

---

## 6A — SIGNUP FLOW

**What you see (output):** the Signup screen — a "Create account" card with a
role selector (User / Admin), a Company field (default
`Employee-Management-System`), Email, Password, Confirm Password, and a blue
"Create account" button.

**Step-by-step:**
1. You fill the form and click "Create account".
2. `SignupPage.jsx` validates the fields on screen.
3. It calls `signup()` from AuthContext → `authService.signup()` → axios `POST /api/auth/signup`.
4. Backend `auth_routes.signup` receives it, Pydantic validates the body.
5. `auth_controller.signup` checks the email is new, finds-or-creates the company, hashes the password, saves the user, and returns a JWT token.
6. Frontend saves the token + user (auto-login) and navigates to the dashboard.

### Frontend: `src/pages/SignupPage.jsx` (key parts)

```jsx
// validation: button only proceeds if all fields are valid
const validate = () => {
  const next = {};
  if (form.company.trim().length < 2) next.company = "Company name is required";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = "Enter a valid email address";
  if (form.password.length < 6) next.password = "Password must be at least 6 characters";
  if (form.confirm !== form.password) next.confirm = "Passwords do not match";
  setErrors(next);
  return Object.keys(next).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;                       // stop if invalid
  setLoading(true);
  try {
    await signup(form.email, form.password, form.role, form.company.trim());
    toast.success("Account created!");
    navigate("/dashboard");                       // auto-login -> go to dashboard
  } catch (err) {
    toast.error(err.response?.data?.detail || "Signup failed");
  } finally {
    setLoading(false);
  }
};
```
- `validate()` builds an `errors` object. The email regex checks `something@something.something`. If `errors` is empty, the form is valid.
- `handleSubmit()` stops if invalid, otherwise calls `signup(...)` (from AuthContext). On success it shows a toast and redirects. On failure it shows the backend's error message (`err.response.data.detail`).

### Frontend service: `src/api/authService.js`
```js
async signup(email, password, role, company) {
  const { data } = await axiosClient.post("/api/auth/signup", { email, password, role, company });
  return data;   // { access_token, token_type, user }
}
```
- Sends a POST request with the form data as JSON. Returns whatever the backend sends back (a token + the new user).

### Backend route: `backend/app/routes/auth_routes.py`
```py
25 @router.post("/signup", response_model=TokenResponse)
26 def signup(payload: SignupRequest, db: Session = Depends(get_db)):
27     return ctrl.signup(db, payload)
```
- **Line 25:** defines `POST /api/auth/signup`. `response_model=TokenResponse` means FastAPI will shape the reply to match that schema.
- **Line 26:** `payload: SignupRequest` makes FastAPI **automatically validate** the incoming JSON against the schema (below). `db: Session = Depends(get_db)` gives this function a database session.
- **Line 27:** hand off to the controller (route stays thin).

### Backend schema: `backend/app/schemas/auth_schema.py`
```py
14 class SignupRequest(BaseModel):
15     email: EmailStr                      # must be a valid email
16     password: str = Field(..., min_length=6)   # at least 6 chars
17     role: RoleType = "user"              # only "admin" or "user", default user
18     company: str = Field(..., min_length=2)
```
- This is the **contract** for signup. If the client sends a bad email or a 3-char password, FastAPI rejects it automatically with a 422 error — the controller never even runs. (`RoleType = Literal["admin","user"]` on line 6 restricts role to those two values.)

### Backend controller: `backend/app/controllers/auth_controller.py`
```py
38 def signup(db: Session, payload: SignupRequest) -> dict:
39     if db.query(User).filter(User.email == payload.email).first():
40         raise HTTPException(status_code=409, detail="An account with that email already exists")
45     company = _get_or_create_company(db, payload.company.strip())
47     user = User(
48         email=payload.email,
49         hashed_password=hash_password(payload.password),
50         role=payload.role,
51         company_id=company.id,
52     )
53     db.add(user)
54     db.commit()
55     db.refresh(user)
56     return _issue_token(user)
```
- **Line 39-40:** look in the `users` table for that email. If it already exists, stop and return error 409 (conflict).
- **Line 45:** find the company by name, or create it if new (`_get_or_create_company`, lines 18-25). This is the multi-tenant "find-or-create".
- **Line 47-52:** build a new `User`. **Crucially, line 49 hashes the password** — we never store the plain password.
- **Line 53-55:** `add` stages it, `commit` saves to the DB file (permanent), `refresh` reloads it so we get the generated `id`.
- **Line 56:** `_issue_token` (lines 13-15) creates a JWT and returns `{access_token, token_type, user}`.

### Password hashing: `backend/app/utils/security.py`
```py
11 pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
14 def hash_password(plain: str) -> str:
15     return pwd_context.hash(plain)
```
- bcrypt turns "admin123" into something like `$2b$12$Xy...`. It's **one-way** — you can't reverse it. That's why login compares hashes instead of reading the password back.

**End result:** the new user is in the database, and the frontend received a
token, so they are logged in immediately.

---

## 6B — LOGIN FLOW

**What you see (output):** the Login screen — a centered white card with an
avatar badge, "Welcome Back!", Email + Password (with a show/hide eye icon),
Remember me + Forgot password, and a blue "Login" button.

**Step-by-step:** enter email+password → `LoginPage` → `authService.login` →
`POST /api/auth/login` → `auth_controller.authenticate` verifies password →
returns JWT → frontend saves it → dashboard.

### Frontend: `src/pages/LoginPage.jsx` (key part)
```jsx
const handleSubmit = async () => {
  setError("");
  setLoading(true);
  try {
    await login(email, password);     // from AuthContext
    toast.success("Welcome back!");
    navigate("/dashboard");
  } catch (err) {
    const message = err.response?.data?.detail || "Login failed. Check your credentials.";
    setError(message);
    toast.error(message);
  } finally {
    setLoading(false);
  }
};
```
- Calls `login()`. If the backend says the password is wrong (401), the `catch` shows "Invalid email or password".
- The password field uses `type={showPassword ? "text" : "password"}` so the eye icon toggles visibility.

### Frontend service: `src/api/authService.js`
```js
async login(email, password) {
  const { data } = await axiosClient.post("/api/auth/login", { email, password });
  return data;   // { access_token, token_type, user }
}
```

### Backend route: `backend/app/routes/auth_routes.py`
```py
20 @router.post("/login", response_model=TokenResponse)
21 def login(payload: LoginRequest, db: Session = Depends(get_db)):
22     return ctrl.authenticate(db, payload)
```

### Backend controller: `backend/app/controllers/auth_controller.py`
```py
28 def authenticate(db: Session, payload: LoginRequest) -> dict:
29     user = db.query(User).filter(User.email == payload.email).first()
30     if not user or not verify_password(payload.password, user.hashed_password):
31         raise HTTPException(status_code=401, detail="Invalid email or password")
35     return _issue_token(user)
```
- **Line 29:** find the user by email.
- **Line 30:** two checks at once — if the user doesn't exist **OR** the password doesn't match the stored hash, fail. (`verify_password` re-hashes the typed password and compares; line 18-19 of security.py.) Using one combined message avoids telling attackers whether the email exists.
- **Line 35:** if valid, issue a JWT and return it with the user.

### What the token is: `backend/app/utils/security.py`
```py
22 def create_access_token(data: dict) -> str:
23     to_encode = data.copy()
24     expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
27     to_encode.update({"exp": expire})
28     return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```
- A JWT is a signed string containing `sub` (the user's email), `role`, and `exp` (expiry time). It's signed with `SECRET_KEY`, so the server can later verify it wasn't tampered with. The frontend stores it and sends it back on every request.

**End result:** frontend saves the token (via `persistSession`) and navigates
to the dashboard.

---

## 6C — FORGOT PASSWORD FLOW

**What you see (output):** the "Reset password" screen — Email, New password,
Confirm new password, and an "Update password" button. On success it shows a
green check and redirects to login.

**Step-by-step:** fill the form → `ForgotPasswordPage` →
`authService.resetPassword` → `POST /api/auth/reset-password` →
`auth_controller.reset_password` updates the hashed password → redirect to login.

### Frontend: `src/pages/ForgotPasswordPage.jsx` (key part)
```jsx
const validate = () => {
  const next = {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = "Enter a valid email address";
  if (form.newPassword.length < 6) next.newPassword = "Password must be at least 6 characters";
  if (form.confirm !== form.newPassword) next.confirm = "Passwords do not match";
  setErrors(next);
  return Object.keys(next).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  setLoading(true);
  try {
    await authService.resetPassword(form.email, form.newPassword);
    setDone(true);                       // show success screen
    toast.success("Password updated");
    setTimeout(() => navigate("/login"), 1500);
  } catch (err) {
    toast.error(err.response?.data?.detail || "Reset failed");
  } finally {
    setLoading(false);
  }
};
```

### Backend controller: `backend/app/controllers/auth_controller.py`
```py
59 def reset_password(db: Session, payload: ResetPasswordRequest) -> dict:
60     user = db.query(User).filter(User.email == payload.email).first()
61     if not user:
62         raise HTTPException(status_code=404, detail="No account found with that email")
66     user.hashed_password = hash_password(payload.new_password)
67     db.commit()
68     return {"message": "Password updated successfully"}
```
- **Line 60-62:** find the account by email; if none, 404.
- **Line 66:** hash the **new** password and overwrite the old hash.
- **Line 67:** save. Next login uses the new password.

> **Honest note for the review:** a real production app would email a one-time
> reset link/token instead of letting anyone set a new password by email alone.
> This simpler version is intentional for the learning project.

---

## 6D — HOW THE TOKEN PROTECTS PAGES (used by all logged-in screens)

After login, every protected request carries the token (axios adds it). On the
backend, two dependency functions guard the routes.

### `backend/app/utils/deps.py`
```py
23 def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
26     payload = decode_access_token(token)
27     if not payload or "sub" not in payload:
28         raise _credentials_error
30     user = db.query(User).filter(User.email == payload["sub"]).first()
31     if user is None:
32         raise _credentials_error
33     return user
36 def require_admin(current_user: User = Depends(get_current_user)) -> User:
37     if current_user.role != "admin":
38         raise HTTPException(status_code=403, detail="Admin privileges required for this action")
41     return current_user
```
- **`get_current_user`:** reads the token, decodes it (line 26), and looks up the user **fresh from the database** by the email in the token (line 30). Any route that needs login adds `Depends(get_current_user)`.
- **`require_admin`:** builds on the above and additionally checks `role == "admin"` (line 37). Admin-only routes (create/update/delete employee, reports, audit logs, approvals) use this.
- **Why this matters for security:** the role is checked **against the live DB on every request**, not trusted blindly from the token. So even if someone hides the UI buttons or calls the API directly, the backend still blocks non-admins.

### Frontend route guard: `src/routes/ProtectedRoute.jsx`
```jsx
if (!isAuthenticated) return <Navigate to="/login" replace />;       // not logged in
if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;  // not admin
if (userOnly && isAdmin) return <Navigate to="/dashboard" replace />;    // not a plain user
return children;
```
- This is the **frontend** half of access control: it redirects you away from pages you shouldn't see. The backend is the real enforcer; this just makes the UI behave correctly.

---

# PART 7 — Every File, Explained

## Backend

**`run.py`** — the start button. `python run.py` launches Uvicorn which serves
the app on port 8000 with auto-reload.

**`app/main.py`** — the assembler. Creates the FastAPI app, enables CORS (so the
frontend on :5173 may call :8000), registers every router, and on startup
creates all tables (`Base.metadata.create_all`) and runs `seed_database()`.

**`app/config/settings.py`** — one place for all settings: database URL, JWT
`SECRET_KEY`, token expiry minutes, allowed CORS origins. Reads environment
variables with sensible defaults.

**`app/database/connection.py`** — the database plumbing.
- `engine` = the actual connection to the SQLite file.
- `SessionLocal` = a factory that creates a short-lived "session" (a workspace) per request.
- `Base` = the parent class every model inherits from.
- `get_db()` = a dependency that opens a session, hands it to the route, and **always closes it** (the `finally` block) so connections don't leak.

**`app/database/seed.py`** — inserts starting data **only if the tables are
empty**. Creates two companies (`Employee-Management-System` and `Globex`), the
departments, the demo users (`admin@gmail.com`, `user@gmail.com`, plus a Globex
pair), and sample employees. This is where the **login credentials** come from.

**`app/models/*.py`** — each file = one database table (see PART 5). Columns are
`Column(...)`; links between tables are `relationship(...)` + `ForeignKey(...)`.
`company_id` on users/employees is what enables tenant isolation.

**`app/schemas/*.py`** — Pydantic models that validate input and shape output.
E.g. `EmployeeCreate` says a new employee needs name/email/position; `EmployeeOut`
says what we send back. They guarantee the API contract and auto-reject bad data.

**`app/controllers/*.py`** — the business logic:
- `auth_controller` — login, signup, password reset (explained above).
- `employee_controller` — list/get/create/update/delete employees, **all filtered by `company_id`**, and each write calls the audit logger.
- `role_request_controller` — create a role request (verifies password), list pending, approve (flips the user's role), reject — all company-scoped and audit-logged.
- `analytics_controller` — counts totals and groups employees by department/role/status for the dashboard.
- `report_controller` — builds the attendance CSV string.
- `audit_controller` — `write_log()` saves an activity row; `list_logs()` reads them.

**`app/routes/*.py`** — the URLs. Each route is thin: validate via schema, call
the controller, return the result. Read routes use `Depends(get_current_user)`;
write/admin routes use `Depends(require_admin)`.

**`app/utils/security.py`** — password hashing (`hash_password`,
`verify_password`) and JWT (`create_access_token`, `decode_access_token`).

**`app/utils/deps.py`** — `get_current_user` and `require_admin` route guards
(explained in 6D).

## Frontend

**`main.jsx`** — mounts React and wraps the whole app in `ThemeProvider`,
`AuthProvider`, `BrowserRouter`, and the toast `<Toaster/>`. Wrapping here means
every component can use theme, auth, and routing.

**`App.jsx`** — just renders `<AppRoutes/>`.

**`index.css`** — Tailwind imports + global styles (page background, scrollbar,
fade animation).

**`api/axiosClient.js`** — the configured axios instance (explained in 6.0a).

**`api/authService.js` / `employeeService.js` / `analyticsService.js` /
`auditService.js` / `roleRequestService.js`** — thin wrappers around axios, one
per feature. UI components import these and never call axios directly. This is
the "separation of services and UI" your mentor asks about.

**`context/AuthContext.jsx`** — app-wide login state (explained in 6.0b).

**`context/ThemeContext.jsx`** — stores "dark" or "light", toggles a class on
`<html>`, and remembers the choice in localStorage.

**`routes/AppRoutes.jsx`** — the map of URL → page. Public routes (login, signup,
forgot) are open; the rest are wrapped in `ProtectedRoute`. Departments,
Attendance, Requests, Audit Logs are `adminOnly`; Settings is `userOnly`.

**`routes/ProtectedRoute.jsx`** — the redirect guard (explained in 6D).

**`components/common/*`** — small reusable building blocks:
- `Button` (variants: primary/secondary/danger/ghost), `Input` (label + error),
  `Modal` (popup shell), `Badge` (pill), `Spinner` (loading), `ConfirmDialog`
  (the "are you sure?" before delete).

**`components/layout/*`:**
- `Sidebar` — the navy left menu; filters items by role; shows the project name and the user footer.
- `Navbar` — top bar: menu toggle, search box, notification bell (admins, with pending-count badge), theme toggle, user info + logout.
- `DashboardLayout` — the shell that places Sidebar + Navbar around the page content (`<Outlet/>`).
- `AuthLayout` — the centered shell for login/signup/forgot.

**`components/employees/*`:**
- `EmployeeTable` — table view with client-side sorting and pagination.
- `EmployeeCard` — card view of one employee.
- `EmployeeForm` — the Add/Edit form; required fields (Name, Email, Role, Department); the submit button stays disabled until all are valid.
- `EmployeeFilters` — search box + department filter + table/card toggle + Add button.
- `StatusBadge` — coloured Active/Inactive/On-Leave pill.

**`components/dashboard/*`:**
- `StatCard` — one KPI tile (icon circle + label + number).
- `Charts` — `DepartmentChart` (bar), `RoleChart` (horizontal bar), `StatusChart` (pie), built with Recharts.

**`pages/*`** — full screens:
- `LoginPage`, `SignupPage`, `ForgotPasswordPage` — the auth screens (PART 6).
- `DashboardPage` — fetches `/api/analytics`, shows the 4 KPI cards + 3 charts + a Refresh button.
- `EmployeesPage` — the main CRUD page: fetches employees, handles search/filter, opens the modal form for add/edit, confirm dialog for delete, and shows loading/error/empty states.
- `DepartmentsPage` — departments with employee counts.
- `AttendancePage` — attendance overview + admin-only CSV download button.
- `RequestsPage` — admin view of pending role requests with Approve/Reject.
- `AuditLogsPage` — admin activity-history table.
- `SettingsPage` — user-only: request promotion to admin (verify password + name a reviewer admin).

**`utils/constants.js`** — `NAV_ITEMS` (sidebar list with `adminOnly`/`userOnly`
flags) and `EMPLOYEE_STATUSES`.

---

# PART 8 — Mentor Review: Likely Questions & Short Answers

**Q: Explain the request flow.**
Page → service (api/*.js) → axios (attaches JWT) → backend route → controller →
model → SQLite, and the JSON response travels back the same way.

**Q: How does authentication work?**
On login the backend verifies the password against a bcrypt hash and returns a
signed JWT. The frontend stores it in localStorage; axios attaches it to every
request; `get_current_user` decodes it and loads the user from the DB.

**Q: How is role-based access enforced?**
Two layers. Frontend `ProtectedRoute` + `isAdmin` hide/redirect. Backend
`require_admin` re-checks the role from the database on every request, so the UI
can't be bypassed.

**Q: How does session persistence work?**
The token + user are saved in localStorage. On app load, `AuthContext` restores
them, so a refresh keeps you logged in. A 401 clears them and forces re-login.

**Q: How is the password reset done?**
`/api/auth/reset-password` finds the user by email and overwrites the bcrypt
hash with the new password. (Production would email a one-time token.)

**Q: How does multi-tenant isolation work?**
Every user and employee has a `company_id`. Every employee/analytics/audit query
filters by the logged-in user's `company_id`, so companies can't see each
other's data.

**Q: How does the audit log work?**
The employee and role-request controllers call `audit_controller.write_log()`
inside the same action, recording who did what and when, scoped to the company.

**Q: Why controllers separate from routes?**
Routes only handle HTTP (receive + respond); controllers hold the logic. This
keeps code testable, reusable, and easy to read (separation of concerns).
