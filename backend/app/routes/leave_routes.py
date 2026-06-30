
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers import leave_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.leave_schema import LeaveCreate, LeaveOut
from app.utils.deps import require_admin, require_attendance_access

router = APIRouter(prefix="/api/leaves", tags=["Leave"])


@router.post("", response_model=LeaveOut, status_code=status.HTTP_201_CREATED)
def submit(payload: LeaveCreate, db: Session = Depends(get_db),
           current_user: User = Depends(require_attendance_access)):
    return ctrl.submit_leave(db, current_user, payload)


@router.get("/mine", response_model=list[LeaveOut])
def mine(db: Session = Depends(get_db),
         current_user: User = Depends(require_attendance_access)):
    return ctrl.my_leaves(db, current_user)


@router.get("/pending", response_model=list[LeaveOut])
def pending(db: Session = Depends(get_db),
            current_admin: User = Depends(require_admin)):
    return ctrl.list_pending(db, current_admin)


@router.post("/{leave_id}/approve", response_model=LeaveOut)
def approve(leave_id: int, db: Session = Depends(get_db),
            current_admin: User = Depends(require_admin)):
    return ctrl.approve_leave(db, current_admin, leave_id)


@router.post("/{leave_id}/reject", response_model=LeaveOut)
def reject(leave_id: int, db: Session = Depends(get_db),
           current_admin: User = Depends(require_admin)):
    return ctrl.reject_leave(db, current_admin, leave_id)
