"""Member management: list members + deactivate (admin, company-scoped)."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.user_model import User


def list_members(db: Session, current_admin: User) -> list[User]:
    return (
        db.query(User)
        .filter(User.company_id == current_admin.company_id)
        .order_by(User.email)
        .all()
    )


def deactivate(db: Session, current_admin: User, user_id: int) -> User:
    if user_id == current_admin.id:
        raise HTTPException(400, "You cannot deactivate your own account")
    user = (
        db.query(User)
        .filter(User.id == user_id, User.company_id == current_admin.company_id)
        .first()
    )
    if not user:
        raise HTTPException(404, "Member not found")
    if not user.is_active:
        raise HTTPException(409, "User is already deactivated")
    user.is_active = False
    user.deactivated_by = current_admin.email
    db.commit()
    audit_controller.write_log(
        db, company_id=current_admin.company_id, user_name=current_admin.email,
        action="User Deactivated", target=user.email,
    )
    return user
