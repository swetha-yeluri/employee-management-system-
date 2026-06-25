"""Leave request logic: submit (user), list mine, and admin approve/reject.
Company-scoped + audit-logged.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.leave_request_model import LeaveRequest
from app.models.user_model import User
from app.schemas.leave_schema import LeaveCreate


def submit_leave(db: Session, user: User, payload: LeaveCreate) -> LeaveRequest:
    if payload.end_date < payload.start_date:
        raise HTTPException(400, "End date cannot be before start date")
    leave = LeaveRequest(
        company_id=user.company_id, user_id=user.id, user_email=user.email,
        leave_type=payload.leave_type, start_date=payload.start_date,
        end_date=payload.end_date, reason=payload.reason, status="pending",
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    audit_controller.write_log(
        db, company_id=user.company_id, user_name=user.email,
        action="Leave Request Submitted", target=f"{payload.leave_type} ({payload.start_date})",
    )
    return leave


def my_leaves(db: Session, user: User):
    return (
        db.query(LeaveRequest)
        .filter(LeaveRequest.user_id == user.id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )


def list_pending(db: Session, admin: User):
    return (
        db.query(LeaveRequest)
        .filter(LeaveRequest.company_id == admin.company_id,
                LeaveRequest.status == "pending")
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )


def _get_leave(db, admin, leave_id):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave or leave.company_id != admin.company_id:
        raise HTTPException(404, "Leave request not found")
    if leave.status != "pending":
        raise HTTPException(409, "Already processed")
    return leave


def approve_leave(db: Session, admin: User, leave_id: int):
    leave = _get_leave(db, admin, leave_id)
    leave.status = "approved"
    leave.decided_by = admin.email
    db.commit()
    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action="Leave Request Approved", target=leave.user_email,
    )
    return leave


def reject_leave(db: Session, admin: User, leave_id: int):
    leave = _get_leave(db, admin, leave_id)
    leave.status = "rejected"
    leave.decided_by = admin.email
    db.commit()
    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action="Leave Request Rejected", target=leave.user_email,
    )
    return leave
