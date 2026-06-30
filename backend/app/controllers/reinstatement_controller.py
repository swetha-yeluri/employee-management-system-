
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller, notification_controller
from app.models.reinstatement_request_model import ReinstatementRequest
from app.models.user_model import User


def submit(db: Session, user: User, reason: str) -> ReinstatementRequest:
    if not user.is_suspended:
        raise HTTPException(400, "Your account is not suspended")
    pending = (
        db.query(ReinstatementRequest)
        .filter(ReinstatementRequest.user_id == user.id,
                ReinstatementRequest.status == "pending")
        .first()
    )
    if pending:
        raise HTTPException(409, "You already have a pending reinstatement request")

    req = ReinstatementRequest(
        company_id=user.company_id, user_id=user.id, user_email=user.email,
        reason=reason, suspended_by=user.suspended_by, status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    audit_controller.write_log(
        db, company_id=user.company_id, user_name=user.email,
        action="Reinstatement Request Submitted", target=reason,
    )
    
    if user.suspended_by:
        notification_controller.notify_email(
            db, company_id=user.company_id, email=user.suspended_by,
            message=f"{user.email} requested reinstatement: {reason}",
        )
    return req


def list_mine(db: Session, user: User):
    return (
        db.query(ReinstatementRequest)
        .filter(ReinstatementRequest.user_id == user.id)
        .order_by(ReinstatementRequest.created_at.desc())
        .all()
    )


def list_pending(db: Session, admin: User):
    return (
        db.query(ReinstatementRequest)
        .filter(ReinstatementRequest.company_id == admin.company_id,
                ReinstatementRequest.status == "pending")
        .order_by(ReinstatementRequest.created_at.desc())
        .all()
    )


def _get(db, admin, req_id):
    req = db.query(ReinstatementRequest).filter(ReinstatementRequest.id == req_id).first()
    if not req or req.company_id != admin.company_id:
        raise HTTPException(404, "Request not found")
    if req.status != "pending":
        raise HTTPException(409, "Request already processed")
    return req


def approve(db: Session, admin: User, req_id: int):
    req = _get(db, admin, req_id)
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Reinstate: Suspended -> Active, role/access untouched (no recreation)
    user.is_suspended = False
    user.suspended_by = None
    user.suspended_at = None
    user.suspension_reason = None
    req.status = "approved"
    req.decided_by = admin.email
    db.commit()

    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action="Reinstatement Approved", target=req.user_email,
    )
    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action="User Reinstated", target=req.user_email,
    )
    notification_controller.notify_email(
        db, company_id=admin.company_id, email=req.user_email,
        message="Your account has been reinstated. You now have full access again.",
    )
    return req


def reject(db: Session, admin: User, req_id: int):
    req = _get(db, admin, req_id)
    req.status = "rejected"
    req.decided_by = admin.email
    db.commit()
    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action="Reinstatement Rejected", target=req.user_email,
    )
    notification_controller.notify_email(
        db, company_id=admin.company_id, email=req.user_email,
        message="Your reinstatement request was rejected.",
    )
    return req
