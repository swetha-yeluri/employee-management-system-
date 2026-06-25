"""Business logic for the role-change request workflow, scoped per company
and recorded in the audit log.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.role_request_model import RoleRequest
from app.models.user_model import User
from app.schemas.role_request_schema import RoleRequestCreate
from app.utils.security import verify_password


def create_request(db: Session, current_user: User, payload: RoleRequestCreate) -> RoleRequest:
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot request a role change",
        )

    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    # Reviewer must be a real admin in the SAME company (tenant isolation).
    reviewer = (
        db.query(User)
        .filter(
            User.email == payload.admin_email,
            User.role == "admin",
            User.company_id == current_user.company_id,
        )
        .first()
    )
    if not reviewer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No admin account found with that email in your company",
        )

    existing = (
        db.query(RoleRequest)
        .filter(
            RoleRequest.requester_id == current_user.id,
            RoleRequest.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending request awaiting review",
        )

    request = RoleRequest(
        company_id=current_user.company_id,
        requester_id=current_user.id,
        requester_email=current_user.email,
        admin_email=payload.admin_email,
        requested_role="admin",
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    audit_controller.write_log(
        db,
        company_id=current_user.company_id,
        user_name=current_user.email,
        action="Role Change Requested",
        target=current_user.email,
    )
    return request


def list_mine(db: Session, current_user: User) -> list[RoleRequest]:
    return (
        db.query(RoleRequest)
        .filter(RoleRequest.requester_id == current_user.id)
        .order_by(RoleRequest.created_at.desc())
        .all()
    )


def list_pending_for_admin(db: Session, current_admin: User) -> list[RoleRequest]:
    return (
        db.query(RoleRequest)
        .filter(
            RoleRequest.admin_email == current_admin.email,
            RoleRequest.company_id == current_admin.company_id,
            RoleRequest.status == "pending",
        )
        .order_by(RoleRequest.created_at.desc())
        .all()
    )


def _get_actionable_request(db: Session, current_admin: User, request_id: int) -> RoleRequest:
    request = db.query(RoleRequest).filter(RoleRequest.id == request_id).first()
    if not request or request.company_id != current_admin.company_id:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.admin_email != current_admin.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request was not assigned to you",
        )
    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has already been processed",
        )
    return request


def approve(db: Session, current_admin: User, request_id: int) -> RoleRequest:
    request = _get_actionable_request(db, current_admin, request_id)
    user = db.query(User).filter(User.id == request.requester_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Requesting user no longer exists")

    user.role = request.requested_role
    request.status = "approved"
    db.commit()
    db.refresh(request)

    audit_controller.write_log(
        db,
        company_id=current_admin.company_id,
        user_name=current_admin.email,
        action="Role Change Approved",
        target=request.requester_email,
    )
    return request


def reject(db: Session, current_admin: User, request_id: int) -> RoleRequest:
    request = _get_actionable_request(db, current_admin, request_id)
    request.status = "rejected"
    db.commit()
    db.refresh(request)

    audit_controller.write_log(
        db,
        company_id=current_admin.company_id,
        user_name=current_admin.email,
        action="Role Change Rejected",
        target=request.requester_email,
    )
    return request
