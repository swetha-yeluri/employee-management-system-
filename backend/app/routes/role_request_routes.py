"""Role-change request endpoints.

- Creating / viewing one's own requests requires any logged-in user.
- Viewing pending requests and approving/rejecting requires admin.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers import role_request_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.role_request_schema import RoleRequestCreate, RoleRequestOut
from app.utils.deps import require_active_user, require_admin

router = APIRouter(prefix="/api/role-requests", tags=["Role Requests"])


@router.post("", response_model=RoleRequestOut, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: RoleRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    return ctrl.create_request(db, current_user, payload)


@router.get("/mine", response_model=list[RoleRequestOut])
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    return ctrl.list_mine(db, current_user)


@router.get("/pending", response_model=list[RoleRequestOut])
def pending_requests(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ctrl.list_pending_for_admin(db, current_admin)


@router.post("/{request_id}/approve", response_model=RoleRequestOut)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ctrl.approve(db, current_admin, request_id)


@router.post("/{request_id}/reject", response_model=RoleRequestOut)
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ctrl.reject(db, current_admin, request_id)
