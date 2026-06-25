# Backend — FastAPI + SQLite

## Run

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Server: http://localhost:8000 · Swagger docs: http://localhost:8000/docs

## Structure

```
backend/
├── app/
│   ├── routes/        # HTTP endpoints (thin)
│   ├── controllers/   # Business logic
│   ├── models/        # SQLAlchemy tables (Employee, Department, User)
│   ├── schemas/       # Pydantic request/response models
│   ├── database/      # Engine, session, seed data
│   ├── utils/         # Security (JWT, hashing), auth dependencies
│   ├── config/        # Settings
│   └── main.py        # App factory + startup
├── requirements.txt
├── run.py
└── README.md
```

## Endpoints

| Method | Path                     | Auth   | Description                |
|--------|--------------------------|--------|----------------------------|
| POST   | /api/auth/login          | public | Log in, returns JWT        |
| GET    | /api/auth/me             | user   | Current user profile       |
| GET    | /api/employees           | user   | List employees             |
| GET    | /api/employees/stats     | user   | Dashboard statistics       |
| GET    | /api/employees/{id}      | user   | Single employee            |
| POST   | /api/employees           | admin  | Create employee            |
| PUT    | /api/employees/{id}      | admin  | Update employee            |
| DELETE | /api/employees/{id}      | admin  | Delete employee            |
| GET    | /api/departments         | user   | List departments           |

The SQLite file `employees.db` is created and seeded automatically on first run.
