"""Employee business logic. Every query is scoped to the caller's company
(multi-tenant isolation) and every write is recorded in the audit log.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.controllers import audit_controller, notification_controller
from app.models.department_transfer_model import DepartmentTransfer
from app.models.department_model import Department
from app.models.employee_model import Employee
from app.models.user_model import User
from app.schemas.employee_schema import EmployeeCreate, EmployeeUpdate


def list_employees(db: Session, company_id: int) -> list[Employee]:
    return (
        db.query(Employee)
        .filter(Employee.company_id == company_id)
        .order_by(Employee.id)
        .all()
    )


def get_employee(db: Session, company_id: int, employee_id: int) -> Employee:
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id, Employee.company_id == company_id)
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee {employee_id} not found",
        )
    return employee


def _validate_department(db: Session, department_id: int | None) -> None:
    if department_id is None:
        return
    if not db.query(Department).filter(Department.id == department_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department {department_id} does not exist",
        )


def create_employee(db: Session, current_user: User, payload: EmployeeCreate) -> Employee:
    if db.query(Employee).filter(Employee.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An employee with that email already exists",
        )
    _validate_department(db, payload.department_id)

    # Force the new employee into the caller's company.
    employee = Employee(**payload.model_dump(), company_id=current_user.company_id)
    db.add(employee)
    db.commit()
    db.refresh(employee)

    audit_controller.write_log(
        db,
        company_id=current_user.company_id,
        user_name=current_user.email,
        action="Employee Created",
        target=employee.name,
    )
    return employee


def update_employee(
    db: Session, current_user: User, employee_id: int, payload: EmployeeUpdate
) -> Employee:
    employee = get_employee(db, current_user.company_id, employee_id)
    data = payload.model_dump(exclude_unset=True)
    if "department_id" in data:
        _validate_department(db, data["department_id"])

    for field, value in data.items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)

    audit_controller.write_log(
        db,
        company_id=current_user.company_id,
        user_name=current_user.email,
        action="Employee Updated",
        target=employee.name,
    )
    return employee


def delete_employee(db: Session, current_user: User, employee_id: int) -> None:
    employee = get_employee(db, current_user.company_id, employee_id)
    name = employee.name
    db.delete(employee)
    db.commit()

    audit_controller.write_log(
        db,
        company_id=current_user.company_id,
        user_name=current_user.email,
        action="Employee Deleted",
        target=name,
    )


def transfer_employee(db, current_user, employee_id, new_department_id):
    """Move an employee to a different department. Creates an audit log, notifies
    the matching user account (if any), and re-evaluates permissions."""
    employee = get_employee(db, current_user.company_id, employee_id)
    new_dept = db.query(Department).filter(Department.id == new_department_id).first()
    if not new_dept:
        raise HTTPException(400, "Target department does not exist")

    old_dept = employee.department.name if employee.department else "Unassigned"
    if employee.department_id == new_department_id:
        raise HTTPException(409, "Employee is already in that department")

    employee.department_id = new_department_id
    db.commit()
    db.refresh(employee)

    # 1) Audit log
    audit_controller.write_log(
        db, company_id=current_user.company_id, user_name=current_user.email,
        action="Employee Transferred",
        target=f"{employee.name}: {old_dept} -> {new_dept.name}",
    )

    # 1b) Maintain department transfer history
    db.add(DepartmentTransfer(
        company_id=current_user.company_id, employee_id=employee.id,
        employee_name=employee.name, from_department=old_dept,
        to_department=new_dept.name, transferred_by=current_user.email,
    ))
    db.commit()

    # 2) Notify the employee (if they have a user account in this company)
    notification_controller.notify_email(
        db, company_id=current_user.company_id, email=employee.email,
        message=f"You have been transferred from {old_dept} to {new_dept.name}.",
    )

    # 3) Update permissions if required. In this system permissions are
    #    role-based, not department-based, so a transfer does not change a
    #    user's role/access. The hook is here if department-driven rules are
    #    ever added.
    return employee


def list_transfers(db, company_id, employee_id):
    """Department transfer history for one employee (company-scoped)."""
    return (
        db.query(DepartmentTransfer)
        .filter(DepartmentTransfer.company_id == company_id,
                DepartmentTransfer.employee_id == employee_id)
        .order_by(DepartmentTransfer.created_at.desc())
        .all()
    )
