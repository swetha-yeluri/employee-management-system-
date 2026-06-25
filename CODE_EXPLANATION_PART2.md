# Code Explanation — PART 2 (Every Remaining File)

This continues `CODE_EXPLANATION.md` (Part 1). Part 1 explained the big picture,
the request flow, and the **auth files line-by-line** (LoginPage, SignupPage,
ForgotPasswordPage, axiosClient, authService, AuthContext, auth_routes,
auth_controller, auth_schema, security, deps).

This Part 2 explains **every other file** — backend first, then frontend.
For UI files, the explanation focuses on what each line/block *does* (the logic
and props), not on every Tailwind CSS class (those are only styling).

---

# BACKEND

## `run.py` — the start button
```py
import uvicorn
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```
- `uvicorn` is the web server that runs FastAPI.
- `"app.main:app"` means "in the file app/main.py, use the variable named `app`".
- `host="0.0.0.0"` = listen on all network interfaces; `port=8000` = the URL is localhost:8000.
- `reload=True` = auto-restart when you edit code (dev convenience).

## `app/main.py` — the assembler
```py
def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME, version=settings.API_VERSION)
    app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
    app.include_router(auth_routes.router)
    app.include_router(employee_routes.router)
    ... (department, report, role_request, analytics, audit)
    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        seed_database()
    @app.get("/", tags=["Health"])
    def health() -> dict:
        return {"status": "ok", "service": settings.PROJECT_NAME}
    return app
app = create_app()
```
- `FastAPI(...)` creates the application object.
- **CORS middleware:** the browser blocks a website on `:5173` from calling a server on `:8000` unless the server says "I allow it". `allow_origins` lists the frontend URL so the calls are permitted. Without this, every frontend request would fail.
- `include_router(...)` plugs each feature's routes into the app. This is why the URLs (`/api/auth/...`, `/api/employees/...`, etc.) exist.
- `@app.on_event("startup")` runs **once when the server boots**: `create_all` creates any missing tables in SQLite; `seed_database()` inserts the starting data.
- `health()` is a simple test endpoint — open `http://localhost:8000/` and you should see `{"status":"ok"}`.
- `import app.models` (top of file) is required so SQLAlchemy "sees" all table classes before `create_all` runs.

## `app/config/settings.py` — all settings in one place
```py
BASE_DIR = Path(__file__).resolve().parent.parent.parent
class Settings:
    PROJECT_NAME = "Enterprise Employee Management System"
    API_VERSION = "v1"
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'employees.db'}")
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-please")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "720"))
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
settings = Settings()
```
- `BASE_DIR` = the backend folder path, computed from this file's location.
- `DATABASE_URL` = where the SQLite file lives. `os.getenv("X", default)` means "use the environment variable X if set, else the default" — so you can change it without editing code.
- `SECRET_KEY` signs the JWT tokens. `ALGORITHM` HS256 is the signing method.
- `ACCESS_TOKEN_EXPIRE_MINUTES = 720` = tokens last 12 hours.
- `settings = Settings()` makes one shared object everything imports.

## `app/database/connection.py` — DB plumbing
```py
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```
- `engine` = the live connection to the SQLite file. `check_same_thread=False` is required because FastAPI may use different threads.
- `SessionLocal` = a factory; calling `SessionLocal()` gives a fresh **session** (a temporary workspace to run queries and commits).
- `Base` = the parent class that every model inherits from; SQLAlchemy uses it to know all the tables.
- `get_db()` = a **dependency**. `yield db` hands a session to the route; the `finally: db.close()` runs after the response, guaranteeing the session is always closed (no leaks). FastAPI calls this automatically wherever you write `Depends(get_db)`.

## `app/database/seed.py` — starting data
```py
PRIMARY = "Employee-Management-System"
SECONDARY = "Globex"
DEPARTMENTS = ["Engineering", "Human Resources", "Sales", "Finance", "Design"]
EMPLOYEES = [ (name, email, position, status, department, company), ... ]
USERS = [ ("admin@gmail.com","admin123","admin",PRIMARY), ("user@gmail.com","user123","user",PRIMARY), ... ]

def seed_database() -> None:
    db = SessionLocal()
    try:
        if db.query(Company).count() == 0:          # only seed when empty
            companies = {name: Company(name=name) for name in [PRIMARY, SECONDARY]}
            for c in companies.values(): db.add(c)
            departments = {name: Department(name=name) for name in DEPARTMENTS}
            for d in departments.values(): db.add(d)
            db.flush()                                # get generated IDs
            for name,email,position,st,dept,comp in EMPLOYEES:
                db.add(Employee(..., department_id=departments[dept].id, company_id=companies[comp].id))
            for email,password,role,comp in USERS:
                db.add(User(email=email, hashed_password=hash_password(password), role=role, company_id=companies[comp].id))
            db.commit()
    finally:
        db.close()
```
- The lists at the top are the data to insert. **This is where your login credentials come from** (`admin@gmail.com`/`user@gmail.com`).
- `if db.query(Company).count() == 0:` — only seed when the DB is empty, so restarts don't duplicate data.
- `db.flush()` sends the companies/departments to the DB so they get their `id` values, which the employees/users then reference.
- Each user's password is hashed before saving (`hash_password`).
- `db.commit()` permanently saves everything.

## Models (`app/models/*.py`) — the database tables

Every model is a Python class that maps to one SQL table. The pattern:
- `__tablename__` = the table name.
- `Column(Type, ...)` = a column. `primary_key=True` = unique row id;
  `unique=True` = no duplicates; `nullable=False` = required; `default=...` =
  value if none given; `ForeignKey("other.id")` = a link to another table.
- `relationship(...)` = a convenient Python link to the related rows (not a real
  column). `back_populates` connects both sides.

**`company_model.py`**
```py
class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    users = relationship("User", back_populates="company")
    employees = relationship("Employee", back_populates="company")
```
A company has an id and a unique name. `users` / `employees` let you do
`company.employees` in Python to get all its employees.

**`user_model.py`** — login accounts.
```py
id, email(unique), hashed_password, role("user"|"admin"), company_id(FK->companies)
company = relationship("Company", back_populates="users")
```
`company_id` is the link that ties a user to one tenant. We store
`hashed_password`, never the plain password.

**`employee_model.py`** — the main records.
```py
id, name, email(unique), position(="Role"), status("Active"), department_id(FK), company_id(FK)
department = relationship(...); company = relationship(...)
```
`position` is shown as "Role" in the UI. `company_id` makes employees
company-specific (isolation).

**`department_model.py`**
```py
id, name(unique); employees = relationship("Employee", back_populates="department")
```

**`role_request_model.py`** — User→Admin requests.
```py
id, company_id, requester_id, requester_email, admin_email,
requested_role("admin"), status("pending"), created_at(default=now)
```
`status` moves pending → approved/rejected. `admin_email` = who must review.

**`audit_log_model.py`** — activity history.
```py
id, company_id, user_name(actor), action(e.g."Employee Created"), target, timestamp(default=now)
```

## Schemas (`app/schemas/*.py`) — validation + response shape

Pydantic models. They (1) validate incoming JSON and (2) define what JSON we
send back. `class Config: from_attributes = True` lets a schema read data
straight from a SQLAlchemy object.

**`employee_schema.py`**
```py
class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    position: str = Field(..., min_length=2, max_length=80)
    status: str = Field(default="Active")
    department_id: Optional[int] = None
class EmployeeCreate(EmployeeBase): ...        # body for POST
class EmployeeUpdate(BaseModel):               # body for PUT (all optional)
    name/email/position/status/department_id all Optional
class DepartmentOut(BaseModel): id, name       # nested in EmployeeOut
class EmployeeOut(EmployeeBase): id, department: Optional[DepartmentOut]
```
- `Field(..., min_length=2)` — the `...` means **required**; min/max length enforce sane values. `EmailStr` rejects non-emails.
- `EmployeeCreate` requires the full set; `EmployeeUpdate` makes everything optional so you can edit just one field.
- `EmployeeOut` is what the API returns, including the nested department object.

**`analytics_schema.py`**
```py
class CountItem(BaseModel): label: str; count: int
class AnalyticsOut(BaseModel):
    total_employees, active_employees, total_departments, pending_requests: int
    by_department, by_role, by_status: list[CountItem]
```
Defines the exact shape of the dashboard data, so the frontend always knows what
to expect. `by_*` are lists of `{label, count}` for the charts.

**`audit_log_schema.py`** — `AuditLogOut`: id, user_name, action, target, timestamp.

**`role_request_schema.py`**
```py
class RoleRequestCreate(BaseModel): current_password: str; admin_email: EmailStr
class RoleRequestOut(BaseModel): id, requester_email, admin_email, requested_role, status, created_at
```
The create body needs the user's current password (identity check) + the
reviewer admin's email.

## Controllers (`app/controllers/*.py`) — the business logic

**`employee_controller.py`** — every function takes `company_id` so data stays
isolated, and writes call the audit logger.
```py
def list_employees(db, company_id):
    return db.query(Employee).filter(Employee.company_id == company_id).order_by(Employee.id).all()
```
- Get all employees **of this company only** (the `.filter(...)` is the isolation), ordered by id.

```py
def get_employee(db, company_id, employee_id):
    employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not employee: raise HTTPException(404, "Employee ... not found")
    return employee
```
- Find one employee by id **and** company. If it belongs to another company, the filter returns nothing → 404. This blocks cross-company access.

```py
def _validate_department(db, department_id):
    if department_id is None: return
    if not db.query(Department).filter(Department.id == department_id).first():
        raise HTTPException(400, "Department ... does not exist")
```
- Helper: if a department id was given, make sure it really exists.

```py
def create_employee(db, current_user, payload):
    if db.query(Employee).filter(Employee.email == payload.email).first():
        raise HTTPException(409, "An employee with that email already exists")
    _validate_department(db, payload.department_id)
    employee = Employee(**payload.model_dump(), company_id=current_user.company_id)
    db.add(employee); db.commit(); db.refresh(employee)
    audit_controller.write_log(db, company_id=..., user_name=current_user.email,
        action="Employee Created", target=employee.name)
    return employee
```
- Reject duplicate email (409). Validate department. `**payload.model_dump()` spreads the validated fields into a new `Employee`, and we force `company_id` to the creator's company. Save, then write an audit log entry.

```py
def update_employee(db, current_user, employee_id, payload):
    employee = get_employee(db, current_user.company_id, employee_id)   # company-checked
    data = payload.model_dump(exclude_unset=True)                       # only sent fields
    if "department_id" in data: _validate_department(db, data["department_id"])
    for field, value in data.items(): setattr(employee, field, value)  # apply changes
    db.commit(); db.refresh(employee)
    audit_controller.write_log(..., action="Employee Updated", target=employee.name)
    return employee
```
- `exclude_unset=True` = only the fields the client actually sent get changed (partial update). `setattr` applies each change to the object; commit saves.

```py
def delete_employee(db, current_user, employee_id):
    employee = get_employee(db, current_user.company_id, employee_id)
    name = employee.name
    db.delete(employee); db.commit()
    audit_controller.write_log(..., action="Employee Deleted", target=name)
```
- Fetch (company-checked), delete, commit, log.

**`analytics_controller.py`**
```py
def get_analytics(db, company_id):
    employees = db.query(Employee).filter(Employee.company_id == company_id).all()
    total = len(employees)
    active = sum(1 for e in employees if e.status == "Active")
    pending_requests = db.query(RoleRequest).filter(company_id==..., status=="pending").count()
    dept_names = {d.id: d.name for d in db.query(Department).all()}
    by_department = {}; by_role = {}; by_status = {}
    for e in employees:
        dname = dept_names.get(e.department_id, "Unassigned")
        by_department[dname] = by_department.get(dname, 0) + 1
        by_role[e.position]  = by_role.get(e.position, 0) + 1
        by_status[e.status]  = by_status.get(e.status, 0) + 1
    return { total_employees, active_employees, total_departments,
             pending_requests, by_department[], by_role[], by_status[] }
```
- Load this company's employees once. `total` = count; `active` = how many are "Active". `pending_requests` counts pending role requests.
- `dept_names` maps department id → name (one lookup table).
- The loop tallies three groupings: how many per department, per role (position), per status. `dict.get(key, 0) + 1` is the classic "count occurrences" pattern.
- Returns plain numbers + lists of `{label, count}` the charts use.

**`report_controller.py`**
```py
def build_attendance_csv(db, company_id):
    employees = db.query(Employee).filter(company_id==...).order_by(Employee.name).all()
    buffer = io.StringIO(); writer = csv.writer(buffer)
    writer.writerow(["ID","Name","Email","Department","Status","Attendance"])
    for emp in employees:
        attendance = "Present" if emp.status == "Active" else emp.status
        writer.writerow([emp.id, emp.name, emp.email, emp.department.name if emp.department else "Unassigned", emp.status, attendance])
    return buffer.getvalue()
```
- Builds a CSV **in memory** (`io.StringIO`). Writes a header row, then one row per employee. `attendance` treats Active as Present. `buffer.getvalue()` returns the whole CSV text, which the route streams as a file download.

**`audit_controller.py`**
```py
def write_log(db, *, company_id, user_name, action, target=""):
    db.add(AuditLog(company_id=company_id, user_name=user_name, action=action, target=target))
    db.commit()
def list_logs(db, company_id):
    return db.query(AuditLog).filter(AuditLog.company_id == company_id).order_by(AuditLog.timestamp.desc()).all()
```
- `write_log` inserts one activity row. The `*` forces keyword arguments (you must write `action=...`), which prevents mix-ups. Other controllers call this.
- `list_logs` returns this company's logs newest-first (`.desc()`).

**`role_request_controller.py`** — covered conceptually in Part 1's flow; the key
functions are `create_request` (verifies password, checks the reviewer is an
admin in the same company, blocks duplicates, saves pending, logs),
`list_mine` / `list_pending_for_admin` (company-scoped reads), and
`approve` / `reject` (only the assigned admin can act; approve flips the user's
`role` to admin; both write an audit log).

## Routes (`app/routes/*.py`) — the URLs

Pattern for every route: declare the URL + method, list dependencies
(`get_db`, `get_current_user`/`require_admin`), call the controller, return it.
`response_model=...` shapes the reply.

**`employee_routes.py`** (`/api/employees`)
```py
@router.get("", response_model=list[EmployeeOut])
def get_employees(db=Depends(get_db), current_user=Depends(get_current_user)):
    return ctrl.list_employees(db, current_user.company_id)
@router.get("/{employee_id}", ...) -> ctrl.get_employee(db, current_user.company_id, employee_id)
@router.post("", status_code=201, ...) current_admin=Depends(require_admin) -> ctrl.create_employee(...)
@router.put("/{employee_id}", ...) require_admin -> ctrl.update_employee(...)
@router.delete("/{employee_id}", status_code=204, ...) require_admin -> ctrl.delete_employee(...)
```
- **Reads** (GET) use `get_current_user` → any logged-in user, and pass `current_user.company_id` so the controller filters by company.
- **Writes** (POST/PUT/DELETE) use `require_admin` → only admins. This is the backend half of role-based access.

**`department_routes.py`** — `GET /api/departments` returns all departments
(any logged-in user). `_: User = Depends(get_current_user)` means "require login
but we don't need the user object" (the `_` name signals 'unused').

**`role_request_routes.py`** (`/api/role-requests`)
- `POST ""` (user) create; `GET /mine` (user) my requests; `GET /pending`
  (admin) requests to review; `POST /{id}/approve` and `POST /{id}/reject`
  (admin).

**`analytics_routes.py`** — `GET /api/analytics` (any logged-in user) →
`ctrl.get_analytics(db, current_user.company_id)`.

**`report_routes.py`** — `GET /api/reports/attendance` (admin only). Returns a
`StreamingResponse` with `Content-Disposition: attachment; filename=...csv`,
which is what makes the browser download a file instead of showing text.

**`audit_routes.py`** — `GET /api/audit-logs` (admin only) →
`ctrl.list_logs(db, current_admin.company_id)`.

---

# FRONTEND

## `main.jsx` — the entry point
```jsx
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" .../>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
```
- Finds `<div id="root">` (from index.html) and renders React into it.
- The **providers wrap the whole app** so every component can use: theme
  (`ThemeProvider`), login state (`AuthProvider`), and routing
  (`BrowserRouter`). `<Toaster/>` enables the popup notifications anywhere.
- `StrictMode` is a dev helper that surfaces bugs (no effect in production).

## `App.jsx`
```jsx
export default function App() { return <AppRoutes />; }
```
Just renders the route table. Kept tiny on purpose.

## `index.css`
Imports Tailwind (`@tailwind base/components/utilities`), sets the body
background (light-blue `bg-page`) and font (Inter), styles the scrollbar, and
defines the `fadeUp` animation used by `.animate-fade-up`.

## `utils/constants.js`
```js
export const NAV_ITEMS = [
  { key, label, path, icon },                  // dashboard, employees -> everyone
  { ..., adminOnly: true },                    // departments, attendance, requests, audit
  { key:"settings", ..., userOnly: true },     // settings -> only users
];
export const EMPLOYEE_STATUSES = ["Active","Inactive","On Leave"];
```
- A single list that drives the sidebar. `icon` is a string matched to a real
  icon in Sidebar. `adminOnly`/`userOnly` flags decide who sees each item.
- `EMPLOYEE_STATUSES` feeds the status dropdown in the employee form.

## `context/ThemeContext.jsx`
```jsx
const [theme, setTheme] = useState(() => localStorage.getItem("ems_theme") || "light");
useEffect(() => {
  const root = document.documentElement;
  theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
  localStorage.setItem("ems_theme", theme);
}, [theme]);
const toggleTheme = () => setTheme(p => p === "dark" ? "light" : "dark");
```
- Starts from the saved theme (or "light"). The effect adds/removes the `dark`
  class on `<html>` — that's what activates every Tailwind `dark:` style — and
  saves the choice so it persists. `toggleTheme` flips it.

## `routes/AppRoutes.jsx` — URL → page map
```jsx
<Routes>
  <Route path="/login" element={<LoginPage/>} />        // public
  <Route path="/signup" .../> <Route path="/forgot-password" .../>
  <Route element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}>  // must be logged in
    <Route path="/dashboard" element={<DashboardPage/>} />
    <Route path="/employees" element={<EmployeesPage/>} />
    <Route path="/departments" element={<ProtectedRoute adminOnly><DepartmentsPage/></ProtectedRoute>} />
    ... attendance, requests, audit-logs (adminOnly)
    <Route path="/settings" element={<ProtectedRoute userOnly><SettingsPage/></ProtectedRoute>} />
  </Route>
  <Route path="/" element={<Navigate to="/dashboard" replace/>} />
  <Route path="*" element={<Navigate to="/dashboard" replace/>} />
</Routes>
```
- Public routes are open. The middle `<Route element={...}>` has no `path`; it's
  a **layout route** — everything inside it renders inside `DashboardLayout`
  (so they all share the sidebar/navbar) and is wrapped in `ProtectedRoute`
  (must be logged in).
- Admin pages get an extra `<ProtectedRoute adminOnly>`; Settings gets
  `userOnly`.
- `/` redirects to the dashboard; `*` (any unknown URL) also redirects.

## `routes/ProtectedRoute.jsx`
```jsx
export default function ProtectedRoute({ children, adminOnly=false, userOnly=false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;                                        // wait for auth check
  if (!isAuthenticated) return <Navigate to="/login" replace .../>;// not logged in
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace/>;
  if (userOnly && isAdmin)   return <Navigate to="/dashboard" replace/>;
  return children;                                                 // allowed
}
```
- The frontend gatekeeper. Reads auth state. While loading, render nothing. If
  not logged in → go to login. If the route is admin-only and you're not an
  admin (or user-only and you are an admin) → bounce to dashboard. Otherwise
  show the page. (The backend still re-checks — this just keeps the UI correct.)

## Services (`api/*.js`)
Each is a thin object of `async` functions that call `axiosClient` and return
`data`. They're the **only** files that know API URLs, so components stay clean.
- `employeeService` — `getAll, getById, create, update, remove, getDepartments`.
- `analyticsService` — `get()` → `/api/analytics`.
- `auditService` — `getLogs()` → `/api/audit-logs`.
- `roleRequestService` — `create, getMine, getPending, approve, reject`.
Example:
```js
async create(payload) {
  const { data } = await axiosClient.post("/api/employees", payload);
  return data;
}
```
`await` waits for the server; `{ data }` pulls the response body out of axios.

## Common components (`components/common/*`)

**`Button.jsx`** — one button with style variants.
```jsx
const VARIANTS = { primary:..., secondary:..., danger:..., ghost:... };
export default function Button({ children, variant="primary", type="button", className="", ...rest }) {
  return <button type={type} className={`...base... ${VARIANTS[variant]} ${className}`} {...rest}>{children}</button>;
}
```
- `variant` picks the colour set from `VARIANTS`. `...rest` forwards any extra
  props (like `onClick`, `disabled`) to the real `<button>`. `children` is the
  button's label/icons.

**`Input.jsx`** — labelled text input with an error message.
```jsx
export default function Input({ label, error, className="", ...rest }) {
  return (<label>... {label} ... <input className={error ? red border : normal} {...rest}/> {error && <span>{error}</span>}</label>);
}
```
- Shows the label, the input (red border if `error`), and the error text below.
  `...rest` forwards `value`, `onChange`, `onBlur`, `type`, `placeholder`.

**`Modal.jsx`** — popup shell.
```jsx
export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;                       // render nothing when closed
  return (<div fixed overlay onClick={onClose} .../> + <div card> title + X(onClose) + children </div>);
}
```
- If `open` is false it renders nothing. The dark overlay closes on click; the
  white card holds the title, a close (X) button, and whatever `children` you
  put inside (e.g. the employee form).

**`Badge.jsx`** — small pill (neutral or accent tone).
**`Spinner.jsx`** — a spinning circle + label, shown during loading.
**`ConfirmDialog.jsx`** — a Modal with a message + Cancel/Confirm buttons; used
before deleting. `onConfirm` runs the delete, `onClose` cancels.

## Layout (`components/layout/*`)

**`DashboardLayout.jsx`** — the shell around every logged-in page.
```jsx
const [sidebarOpen, setSidebarOpen] = useState(true);
const current = NAV_ITEMS.find(i => location.pathname.startsWith(i.path));
const title = current?.label || "Dashboard";
return (<div flex> <Sidebar open={sidebarOpen}/> <div> <Navbar title={title} onToggleSidebar={...}/> <main><Outlet/></main> </div> </div>);
```
- Holds the sidebar open/closed state. Works out the page title from the current
  URL. `<Outlet/>` is where React Router places the actual page
  (Dashboard/Employees/…). So the sidebar + navbar stay put while only the
  middle changes.

**`AuthLayout.jsx`** — centered container for signup/forgot screens (heading +
subheading + form). (Login uses its own card.)

**`Sidebar.jsx`** — the navy menu.
```jsx
const items = NAV_ITEMS.filter(item => item.adminOnly ? isAdmin : item.userOnly ? !isAdmin : true);
... brand "Employee Management System" ...
items.map(item => <NavLink to={item.path} className={active ? blue : grey}>icon + label</NavLink>)
... user footer (email + Administrator/User) ...
```
- Filters the nav list by role (admins don't see Settings; users only see their
  items). `NavLink` automatically knows if it's the active route and styles it
  blue. The footer shows who's logged in.

**`Navbar.jsx`** — top bar.
```jsx
useEffect(() => { if (isAdmin) roleRequestService.getPending().then(list => setPendingCount(list.length)); }, [isAdmin]);
... menu toggle, page title, search box, bell(+badge for admins), theme toggle, user info, logout ...
```
- On mount, if admin, fetches how many requests are pending and shows that count
  as a red badge on the bell. The bell links to `/requests`. Also has the theme
  toggle and logout.

## Dashboard components

**`StatCard.jsx`** — one KPI tile: a coloured icon circle + label + big number.
Props: `label, value, icon, accent` (the colour classes for the circle).

**`Charts.jsx`** — three Recharts charts, each taking `data` = `[{label,count}]`:
- `DepartmentChart` — vertical bar chart of employees per department.
- `RoleChart` — horizontal bar chart of employees per role.
- `StatusChart` — pie chart of status, with a colour legend below.
`ResponsiveContainer` makes them resize to fit; `<Bar/>`/`<Pie/>` read
`dataKey="count"`.

## Employee components

**`StatusBadge.jsx`** — coloured pill for Active (green) / Inactive (grey) /
On Leave (amber). Looks up the colour from a `STYLES` map by `status`.

**`EmployeeFilters.jsx`** — the toolbar above the list.
- A search box (calls `onSearch` as you type), a department `<select>` (calls
  `onDepartment`), a table/cards view toggle (`onViewChange`), and an
  "Add Employee" button shown only if `canCreate` (admin). It doesn't hold data
  itself — it reports changes up to `EmployeesPage` via callback props.

**`EmployeeCard.jsx`** — one employee as a card: initials avatar, name, position,
status badge, email, department, and (if `canManage`) edit/delete buttons that
appear on hover. `initials()` builds e.g. "AS" from "Aarav Sharma".

**`EmployeeTable.jsx`** — table view with **client-side sorting + pagination**.
```jsx
const [sort, setSort] = useState({ key:"name", dir:"asc" });
const [page, setPage] = useState(1);
const sorted = useMemo(() => [...employees].sort(by sort.key/dir), [employees, sort]);
const pageRows = sorted.slice((safePage-1)*PAGE_SIZE, safePage*PAGE_SIZE);  // 6 per page
toggleSort(key) => flip asc/desc or switch column
```
- `sorted` re-sorts only when the data or sort changes (`useMemo` = caching).
  `pageRows` slices out the current page (6 rows). Clicking a column header calls
  `toggleSort`. Prev/Next change `page`. Edit/Delete buttons (admins) call the
  parent's `onEdit`/`onDelete`.

**`EmployeeForm.jsx`** — Add/Edit form with the "disabled until valid" rule.
```jsx
const errors = useMemo(() => { validate name>=2, valid email, position>=2, department chosen }, [form]);
const isValid = Object.keys(errors).length === 0;
const showError = (key) => touched[key] ? errors[key] : undefined;   // only after blur
<Button disabled={!isValid || submitting}>Add Employee</Button>
```
- `errors` is recomputed on every keystroke, so the button's `disabled={!isValid}`
  updates live — it only enables when Name, Email, Role, Department are all valid.
- `touched` makes an error appear only after you leave a field (better UX).
- On submit it sends the form up via `onSubmit` (converting `department_id` to a
  number). Pre-fills fields when editing (the `useEffect` on `initial`).

## Pages (`pages/*`)

**`DashboardPage.jsx`**
```jsx
const load = useCallback(async (isRefresh) => { setData(await analyticsService.get()); ...loading/error... }, []);
useEffect(() => { load(); }, [load]);
<Button onClick={() => load(true)}>Refresh</Button>   // reloads without page refresh
<StatCard .../> x4   +   <DepartmentChart/> <StatusChart/> <RoleChart/>
```
- Fetches analytics on mount. The Refresh button calls `load(true)` again — it
  re-fetches and updates state, so the numbers refresh **without reloading the
  page** (React just re-renders). Shows 4 KPI cards + 3 charts.

**`EmployeesPage.jsx`** — the main CRUD screen (see also the inline comments).
```jsx
loadData(): Promise.all([getAll(), getDepartments()]) -> set state; handles error
filtered = useMemo(() => employees.filter(by search name + department))   // live search/filter
openCreate()/openEdit(emp) -> open the modal (editing=null or the employee)
handleSubmit(payload): editing ? update : create -> toast -> reload
handleDelete(): remove(deleteTarget.id) -> toast -> reload
if loading -> <Spinner/>; if error -> error box + Retry; if filtered empty -> empty state
else table or cards (by `view`) + <Modal><EmployeeForm/></Modal> + <ConfirmDialog/>
```
- This page ties everything together: fetching (with loading/error/empty
  states), live search+filter, switching table/card view, opening the modal
  form for add/edit, and the confirm dialog for delete. After any change it
  re-fetches so the list stays in sync. Admin-only actions are gated by
  `isAdmin` (`canCreate`/`canManage`).

**`DepartmentsPage.jsx`** — loads departments + employees, then for each
department shows a card with the count of employees in it
(`employees.filter(e => e.department?.id === dept.id).length`).

**`AttendancePage.jsx`** — shows an attendance rate (Active ÷ total) and a table
of everyone's status. For admins it shows a "Download Report (CSV)" button that
calls `reportService.downloadAttendanceReport()`.

**`RequestsPage.jsx`** (admin) — loads pending role requests; each row has
Approve/Reject buttons that call the service and then remove that row from the
list. Shows an empty state when there are none.

**`AuditLogsPage.jsx`** (admin) — loads audit logs and shows them in a table
(user, action badge, related target, formatted timestamp).

**`SettingsPage.jsx`** (user only) — lets a user request promotion to admin:
account info, the request form (current password + reviewer admin email,
validated), the status of any existing request, and a theme toggle. On mount it
also calls `refreshUser()` so if a request was just approved, the new role is
picked up.

---

# Quick recap of the patterns to repeat in the review

- **Backend layering:** route (HTTP) → controller (logic) → model (table).
  Schemas validate; `deps.py` guards; `security.py` does crypto.
- **Frontend layering:** page (screen) → service (`api/*.js`) → axios → backend.
  Context holds global state; ProtectedRoute guards; reusable components in
  `components/`.
- **Isolation:** everything filters by `company_id` from the logged-in user.
- **Access control:** UI hides via role; backend enforces via `require_admin`.
- **Audit:** controllers call `write_log` on every important change.
