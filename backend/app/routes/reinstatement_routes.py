
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import reinstatement_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.suspension_schema import ReinstatementCreate, ReinstatementOut
from app.utils.deps import get_current_user, require_admin

router = APIRouter(prefix="/api/reinstatement-requests", tags=["Reinstatement"])


@router.post("", response_model=ReinstatementOut)
def submit(payload: ReinstatementCreate, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    return ctrl.submit(db, current_user, payload.reason)


@router.get("/mine", response_model=list[ReinstatementOut])
def mine(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ctrl.list_mine(db, current_user)


@router.get("/pending", response_model=list[ReinstatementOut])
def pending(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return ctrl.list_pending(db, current_admin)


@router.post("/{request_id}/approve", response_model=ReinstatementOut)
def approve(request_id: int, db: Session = Depends(get_db),
            current_admin: User = Depends(require_admin)):
    return ctrl.approve(db, current_admin, request_id)


@router.post("/{request_id}/reject", response_model=ReinstatementOut)
def reject(request_id: int, db: Session = Depends(get_db),
           current_admin: User = Depends(require_admin)):
    return ctrl.reject(db, current_admin, request_id)
