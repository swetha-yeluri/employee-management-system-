"""Reporting endpoints. Admin-only and company-scoped."""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.controllers import report_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.utils.deps import require_admin

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/attendance")
def download_attendance_report(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    csv_data = ctrl.build_attendance_csv(db, current_admin.company_id)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"},
    )
