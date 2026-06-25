"""Suspension endpoints (Improvement 11)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import suspension_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.suspension_schema import SuspendRequest, SuspensionStatusOut
from app.utils.deps import get_current_user, require_admin

router = APIRouter(prefix="/api/suspension", tags=["Suspension"])


@router.get("/me", response_model=SuspensionStatusOut)
def my_suspension(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    # get_current_user (not require_active_user) so a SUSPENDED user can read this
    return ctrl.get_my_suspension(db, current_user)


@router.post("/suspend/{user_id}")
def suspend(user_id: int, payload: SuspendRequest, db: Session = Depends(get_db),
            current_admin: User = Depends(require_admin)):
    user = ctrl.suspend_user(db, current_admin, user_id, payload.reason)
    return {"message": "User suspended", "email": user.email}
