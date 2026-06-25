"""Reactivation endpoints. submit/mine use get_current_user (deactivated users
must reach these); pending/approve/reject require admin.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers import reactivation_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.reactivation_schema import ReactivationOut
from app.utils.deps import get_current_user, require_admin

router = APIRouter(prefix="/api/reactivation-requests", tags=["Reactivation"])


@router.post("", response_model=ReactivationOut, status_code=status.HTTP_201_CREATED)
def submit(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ctrl.submit(db, current_user)


@router.get("/mine", response_model=list[ReactivationOut])
def mine(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ctrl.list_mine(db, current_user)


@router.get("/pending", response_model=list[ReactivationOut])
def pending(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return ctrl.list_pending_for_admin(db, current_admin)


@router.post("/{request_id}/approve", response_model=ReactivationOut)
def approve(request_id: int, db: Session = Depends(get_db),
            current_admin: User = Depends(require_admin)):
    return ctrl.approve(db, current_admin, request_id)


@router.post("/{request_id}/reject", response_model=ReactivationOut)
def reject(request_id: int, db: Session = Depends(get_db),
           current_admin: User = Depends(require_admin)):
    return ctrl.reject(db, current_admin, request_id)
