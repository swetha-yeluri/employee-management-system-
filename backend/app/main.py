"""Application factory: builds the FastAPI app, wires middleware, registers
routers, creates tables, and seeds initial data on startup.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.connection import Base, engine
from app.database.seed import seed_database
from app.routes import (
    analytics_routes,
    audit_routes,
    auth_routes,
    department_routes,
    employee_routes,
    report_routes,
    role_request_routes,
    invitation_routes,
    member_routes,
    reactivation_routes,
    attendance_routes,
    leave_routes,
    notification_routes,
    activity_routes,
    export_routes,
    suspension_routes,
    reinstatement_routes,
)

import app.models  # noqa: F401  (register tables on Base)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME, version=settings.API_VERSION)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_routes.router)
    app.include_router(employee_routes.router)
    app.include_router(department_routes.router)
    app.include_router(report_routes.router)
    app.include_router(role_request_routes.router)
    app.include_router(analytics_routes.router)
    app.include_router(audit_routes.router)
    app.include_router(invitation_routes.router)
    app.include_router(member_routes.router)
    app.include_router(reactivation_routes.router)
    app.include_router(attendance_routes.router)
    app.include_router(leave_routes.router)
    app.include_router(notification_routes.router)
    app.include_router(activity_routes.router)
    app.include_router(export_routes.router)
    app.include_router(suspension_routes.router)
    app.include_router(reinstatement_routes.router)

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        seed_database()
        api_paths = {r.path for r in app.routes if getattr(r, "path", "").startswith("/api")}
        checks = {
            "Employees/Transfer": "/api/employees",
            "Invitations (Imp 6)": "/api/invitations",
            "Attendance (Imp 7)": "/api/attendance/access",
            "Leaves (Imp 7)": "/api/leaves",
            "Activity (Imp 9)": "/api/activity",
            "Export Center (Imp 10)": "/api/exports/history",
            "Suspension (Imp 11)": "/api/suspension/me",
        }
        print("\n" + "=" * 56)
        print(" Employee Management System - backend started")
        print("=" * 56)
        for label, path in checks.items():
            ok = any(p == path or p.startswith(path) for p in api_paths)
            print(f"  [{'OK ' if ok else 'MISSING'}] {label}")
        print(" If any line says MISSING you are running OLD code.")
        print("=" * 56 + "\n")

    @app.get("/", tags=["Health"])
    def health() -> dict:
        api_paths = sorted({r.path for r in app.routes if getattr(r, "path", "").startswith("/api")})
        return {
            "status": "ok",
            "service": settings.PROJECT_NAME,
            "improvement_6": any("/api/invitations" in p for p in api_paths),
            "improvement_7": any("/api/attendance" in p for p in api_paths),
            "improvement_9": any("/api/activity" in p for p in api_paths),
            "improvement_10": any("/api/exports" in p for p in api_paths),
            "improvement_11": any("/api/suspension" in p for p in api_paths),
            "api_routes": api_paths,
        }

    return app


app = create_app()
