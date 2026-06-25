"""Suspension logic (Improvement 11): admins suspend users/admins in their
company; suspended users can read their own suspension status. Company-scoped,
audit-logged. The actual access-blocking is enforced in deps.require_active_user.
"""
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.user_model import User


def user_status(user: User) -> str:
    if not user.is_active:
        return "Deactivated"
    if user.is_suspended:
        return "Suspended"
    return "Active"


def suspend_user(db: Session, admin: User, user_id: int, reason: str) -> User:
    target = db.query(User).filter(User.id == user_id).first()
    if not target or target.company_id != admin.company_id:
        raise HTTPException(404, "User not found")          # company isolation
    if target.id == admin.id:
        raise HTTPException(400, "You cannot suspend yourself")
    if target.is_suspended:
        raise HTTPException(409, "User is already suspended")

    target.is_suspended = True
    target.suspended_by = admin.email
    target.suspended_at = datetime.utcnow()
    target.suspension_reason = reason
    db.commit()
    db.refresh(target)

    # Audit: "Admin Suspended" if the target is an admin, else "User Suspended"
    action = "Admin Suspended" if target.role == "admin" else "User Suspended"
    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action=action, target=f"{target.email} ({reason})",
    )
    return target


def get_my_suspension(db: Session, user: User) -> dict:
    return {
        "is_suspended": bool(user.is_suspended),
        "status": user_status(user),
        "suspended_at": user.suspended_at,
        "suspension_reason": user.suspension_reason,
        "suspended_by": user.suspended_by,
    }
