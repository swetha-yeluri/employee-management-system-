"""Seeds departments, two companies, their users, and employees.

Primary company is "Employee-Management-System" with demo logins
admin@gmail.com / user@gmail.com. A second company exists so multi-tenant
isolation is visible. Runs only when tables are empty (safe across restarts).
"""
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.company_model import Company
from app.models.department_model import Department
from app.models.employee_model import Employee
from app.models.user_model import User
from app.utils.security import hash_password

PRIMARY = "Employee-Management-System"
SECONDARY = "Globex"

DEPARTMENTS = ["Engineering", "Human Resources", "Sales", "Finance", "Design"]

# (name, email, position, status, department, company)
# NOTE: the first two emails match the demo login accounts, so when an admin
# transfers them the matching user receives an in-app notification.
EMPLOYEES = [
    ("Demo User", "user@gmail.com", "Software Engineer", "Active", "Engineering", PRIMARY),
    ("Demo Admin", "admin@gmail.com", "Engineering Manager", "Active", "Engineering", PRIMARY),
    ("Aarav Sharma", "aarav@ems.com", "Senior Engineer", "Active", "Engineering", PRIMARY),
    ("Diya Patel", "diya@ems.com", "Frontend Engineer", "Active", "Engineering", PRIMARY),
    ("Kabir Singh", "kabir@ems.com", "HR Manager", "Active", "Human Resources", PRIMARY),
    ("Ananya Reddy", "ananya@ems.com", "Recruiter", "On Leave", "Human Resources", PRIMARY),
    ("Vivaan Gupta", "vivaan@ems.com", "Sales Lead", "Active", "Sales", PRIMARY),
    ("Ishita Nair", "ishita@ems.com", "Account Executive", "Inactive", "Sales", PRIMARY),
    ("Arjun Mehta", "arjun@ems.com", "Financial Analyst", "Active", "Finance", PRIMARY),
    # Second company (multi-tenant isolation demo)
    ("Saanvi Iyer", "saanvi@globex.com", "Product Designer", "Active", "Design", SECONDARY),
    ("Rohan Das", "rohan@globex.com", "Backend Engineer", "Active", "Engineering", SECONDARY),
    ("Myra Joshi", "myra@globex.com", "UX Designer", "On Leave", "Design", SECONDARY),
]

# (email, password, role, company)
USERS = [
    ("admin@gmail.com", "admin123", "admin", PRIMARY),
    ("user@gmail.com", "user123", "user", PRIMARY),
    ("admin@globex.com", "admin123", "admin", SECONDARY),
    ("user@globex.com", "user123", "user", SECONDARY),
]


def seed_database() -> None:
    db: Session = SessionLocal()
    try:
        if db.query(Company).count() == 0:
            companies = {name: Company(name=name) for name in [PRIMARY, SECONDARY]}
            for c in companies.values():
                db.add(c)

            departments = {name: Department(name=name) for name in DEPARTMENTS}
            for d in departments.values():
                db.add(d)
            db.flush()

            for name, email, position, st, dept, comp in EMPLOYEES:
                db.add(
                    Employee(
                        name=name, email=email, position=position, status=st,
                        department_id=departments[dept].id,
                        company_id=companies[comp].id,
                    )
                )
            for email, password, role, comp in USERS:
                db.add(
                    User(
                        email=email, hashed_password=hash_password(password),
                        role=role, company_id=companies[comp].id,
                    )
                )
            db.commit()
    finally:
        db.close()
