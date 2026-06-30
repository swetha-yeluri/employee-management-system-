
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers import attendance_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.attendance_schema import (
    AccessRequestOut, AccessStatusOut, RecordOut, SummaryOut, TodayOut,
)
from app.utils.deps import require_active_user, require_admin, require_attendance_access

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.get("/access", response_model=AccessStatusOut)
def access_status(db: Session = Depends(get_db),
                  current_user: User = Depends(require_active_user)):
    return ctrl.get_access_status(db, current_user)


@router.get("/access/pending", response_model=list[AccessRequestOut])
def pending_access(db: Session = Depends(get_db),
                   current_admin: User = Depends(require_admin)):
    return ctrl.list_pending_access(db, current_admin)


@router.post("/access/{request_id}/approve", response_model=AccessRequestOut)
def approve_access(request_id: int, db: Session = Depends(get_db),
                   current_admin: User = Depends(require_admin)):
    return ctrl.approve_access(db, current_admin, request_id)


@router.post("/access/{request_id}/reject", response_model=AccessRequestOut)
def reject_access(request_id: int, db: Session = Depends(get_db),
                  current_admin: User = Depends(require_admin)):
    return ctrl.reject_access(db, current_admin, request_id)


@router.post("/check-in", response_model=RecordOut, status_code=status.HTTP_201_CREATED)
def check_in(db: Session = Depends(get_db),
             current_user: User = Depends(require_attendance_access)):
    return ctrl.check_in(db, current_user)


@router.post("/check-out", response_model=RecordOut)
def check_out(db: Session = Depends(get_db),
              current_user: User = Depends(require_attendance_access)):
    return ctrl.check_out(db, current_user)


@router.get("/today", response_model=TodayOut)
def today(db: Session = Depends(get_db),
          current_user: User = Depends(require_attendance_access)):
    return ctrl.get_today(db, current_user)


@router.get("/history", response_model=list[RecordOut])
def history(db: Session = Depends(get_db),
            current_user: User = Depends(require_attendance_access)):
    return ctrl.get_history(db, current_user)


@router.get("/summary", response_model=SummaryOut)
def summary(db: Session = Depends(get_db),
            current_user: User = Depends(require_attendance_access)):
    return ctrl.get_summary(db, current_user)
