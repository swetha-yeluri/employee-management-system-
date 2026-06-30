
from sqlalchemy.orm import Session

from app.models.department_model import Department
from app.models.employee_model import Employee
from app.models.role_request_model import RoleRequest


def get_analytics(db: Session, company_id: int) -> dict:
    employees = (
        db.query(Employee).filter(Employee.company_id == company_id).all()
    )

    total = len(employees)
    active = sum(1 for e in employees if e.status == "Active")

    pending_requests = (
        db.query(RoleRequest)
        .filter(
            RoleRequest.company_id == company_id,
            RoleRequest.status == "pending",
        )
        .count()
    )

    # Department names for this company's employees
    dept_names = {d.id: d.name for d in db.query(Department).all()}

    by_department: dict[str, int] = {}
    by_role: dict[str, int] = {}
    by_status: dict[str, int] = {}
    for e in employees:
        dname = dept_names.get(e.department_id, "Unassigned")
        by_department[dname] = by_department.get(dname, 0) + 1
        by_role[e.position] = by_role.get(e.position, 0) + 1
        by_status[e.status] = by_status.get(e.status, 0) + 1

    return {
        "total_employees": total,
        "active_employees": active,
        "total_departments": len([d for d in by_department if d != "Unassigned"]),
        "pending_requests": pending_requests,
        "by_department": [{"label": k, "count": v} for k, v in by_department.items()],
        "by_role": [{"label": k, "count": v} for k, v in by_role.items()],
        "by_status": [{"label": k, "count": v} for k, v in by_status.items()],
    }
