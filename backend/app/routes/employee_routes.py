"""Employee API endpoints. Reads require any logged-in user (scoped to their
company); writes/deletes require admin (also company-scoped).
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers import employee_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.employee_schema import TransferRequest, EmployeeCreate, EmployeeOut, EmployeeUpdate
from app.schemas.activity_schema import TransferHistoryOut
from app.utils.deps import require_active_user, require_admin

router = APIRouter(prefix="/api/employees", tags=["Employees"])


@router.get("", response_model=list[EmployeeOut])
def get_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    return ctrl.list_employees(db, current_user.company_id)


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    return ctrl.get_employee(db, current_user.company_id, employee_id)


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ctrl.create_employee(db, current_admin, payload)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ctrl.update_employee(db, current_admin, employee_id, payload)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    ctrl.delete_employee(db, current_admin, employee_id)
    return None


@router.post("/{employee_id}/transfer", response_model=EmployeeOut)
def transfer_employee(employee_id: int, payload: TransferRequest,
                      db: Session = Depends(get_db),
                      current_admin: User = Depends(require_admin)):
    return ctrl.transfer_employee(db, current_admin, employee_id, payload.department_id)


@router.get("/{employee_id}/transfers", response_model=list[TransferHistoryOut])
def transfer_history(employee_id: int, db: Session = Depends(get_db),
                     current_admin: User = Depends(require_admin)):
    return ctrl.list_transfers(db, current_admin.company_id, employee_id)
