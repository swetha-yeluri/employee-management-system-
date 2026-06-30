
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers import invitation_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.auth_schema import TokenResponse
from app.schemas.invitation_schema import (
    InvitationCreate, InvitationOut, InviteAccept, InviteVerifyOut,
)
from app.utils.deps import require_admin

router = APIRouter(prefix="/api/invitations", tags=["Invitations"])


@router.post("", response_model=InvitationOut, status_code=status.HTTP_201_CREATED)
def create(payload: InvitationCreate, db: Session = Depends(get_db),
           current_admin: User = Depends(require_admin)):
    return ctrl.create_invitation(db, current_admin, payload)


@router.get("", response_model=list[InvitationOut])
def pending(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return ctrl.list_pending(db, current_admin)


@router.post("/{invitation_id}/revoke", response_model=InvitationOut)
def revoke(invitation_id: int, db: Session = Depends(get_db),
           current_admin: User = Depends(require_admin)):
    return ctrl.revoke(db, current_admin, invitation_id)


@router.get("/verify/{token}", response_model=InviteVerifyOut)
def verify(token: str, db: Session = Depends(get_db)):
    return ctrl.verify(db, token)


@router.post("/accept", response_model=TokenResponse)
def accept(payload: InviteAccept, db: Session = Depends(get_db)):
    return ctrl.accept(db, payload)
