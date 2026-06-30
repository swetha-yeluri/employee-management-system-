
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import audit_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.audit_log_schema import AuditLogOut
from app.utils.deps import require_admin

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=list[AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ctrl.list_logs(db, current_admin.company_id)
