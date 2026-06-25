"""Member endpoints (admin only, company-scoped)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import member_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.member_schema import MemberOut
from app.utils.deps import require_admin

router = APIRouter(prefix="/api/members", tags=["Members"])


@router.get("", response_model=list[MemberOut])
def members(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return ctrl.list_members(db, current_admin)


@router.post("/{user_id}/deactivate", response_model=MemberOut)
def deactivate(user_id: int, db: Session = Depends(get_db),
               current_admin: User = Depends(require_admin)):
    return ctrl.deactivate(db, current_admin, user_id)
