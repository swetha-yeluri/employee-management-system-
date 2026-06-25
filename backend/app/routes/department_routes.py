"""Department endpoints - used by the employee filter and forms."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.department_model import Department
from app.models.user_model import User
from app.schemas.employee_schema import DepartmentOut
from app.utils.deps import require_active_user

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.get("", response_model=list[DepartmentOut])
def get_departments(
    db: Session = Depends(get_db),
    _: User = Depends(require_active_user),
):
    return db.query(Department).order_by(Department.name).all()
