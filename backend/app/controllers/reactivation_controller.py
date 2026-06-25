"""Reactivation workflow: a deactivated user requests reactivation; the admin
who deactivated them approves/rejects. Company-scoped + audit-logged.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.reactivation_request_model import ReactivationRequest
from app.models.user_model import User


def submit(db: Session, current_user: User) -> ReactivationRequest:
    if current_user.is_active:
        raise HTTPException(400, "Your account is already active")
    if (
        db.query(ReactivationRequest)
        .filter(ReactivationRequest.user_id == current_user.id, ReactivationRequest.status == "pending")
        .first()
    ):
        raise HTTPException(409, "You already have a pending reactivation request")

    req = ReactivationRequest(
        company_id=current_user.company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        admin_email=current_user.deactivated_by or "",
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    audit_controller.write_log(
        db, company_id=current_user.company_id, user_name=current_user.email,
        action="Reactivation Request Submitted", target=current_user.email,
    )
    return req


def list_mine(db: Session, current_user: User) -> list[ReactivationRequest]:
    return (
        db.query(ReactivationRequest)
        .filter(ReactivationRequest.user_id == current_user.id)
        .order_by(ReactivationRequest.created_at.desc())
        .all()
    )


def list_pending_for_admin(db: Session, current_admin: User) -> list[ReactivationRequest]:
    return (
        db.query(ReactivationRequest)
        .filter(
            ReactivationRequest.admin_email == current_admin.email,
            ReactivationRequest.company_id == current_admin.company_id,
            ReactivationRequest.status == "pending",
        )
        .order_by(ReactivationRequest.created_at.desc())
        .all()
    )


def _actionable(db: Session, current_admin: User, request_id: int) -> ReactivationRequest:
    req = db.query(ReactivationRequest).filter(ReactivationRequest.id == request_id).first()
    if not req or req.company_id != current_admin.company_id:
        raise HTTPException(404, "Request not found")
    if req.admin_email != current_admin.email:
        raise HTTPException(403, "This request was not assigned to you")
    if req.status != "pending":
        raise HTTPException(409, "This request has already been processed")
    return req


def approve(db: Session, current_admin: User, request_id: int) -> ReactivationRequest:
    req = _actionable(db, current_admin, request_id)
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(404, "User no longer exists")
    user.is_active = True
    user.deactivated_by = None
    req.status = "approved"
    db.commit()
    db.refresh(req)
    audit_controller.write_log(
        db, company_id=current_admin.company_id, user_name=current_admin.email,
        action="Reactivation Approved", target=user.email,
    )
    audit_controller.write_log(
        db, company_id=current_admin.company_id, user_name=current_admin.email,
        action="User Activated", target=user.email,
    )
    return req


def reject(db: Session, current_admin: User, request_id: int) -> ReactivationRequest:
    req = _actionable(db, current_admin, request_id)
    req.status = "rejected"
    db.commit()
    db.refresh(req)
    audit_controller.write_log(
        db, company_id=current_admin.company_id, user_name=current_admin.email,
        action="Reactivation Rejected", target=req.user_email,
    )
    return req
