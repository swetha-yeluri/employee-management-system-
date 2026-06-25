"""Invitation workflow logic: create/list/revoke (admin) and verify/accept
(public). All admin actions are company-scoped and audit-logged.
"""
import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.company_model import Company
from app.models.invitation_model import Invitation
from app.models.user_model import User
from app.schemas.invitation_schema import InvitationCreate, InviteAccept
from app.utils.security import create_access_token, hash_password


def create_invitation(db: Session, current_admin: User, payload: InvitationCreate) -> Invitation:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(409, "A user with that email already exists")
    if (
        db.query(Invitation)
        .filter(Invitation.email == payload.email, Invitation.status == "pending")
        .first()
    ):
        raise HTTPException(409, "A pending invitation already exists for that email")

    inv = Invitation(
        company_id=current_admin.company_id,
        email=payload.email,
        role=payload.role,
        token=secrets.token_urlsafe(32),
        status="pending",
        invited_by=current_admin.email,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    audit_controller.write_log(
        db, company_id=current_admin.company_id, user_name=current_admin.email,
        action="Invitation Created", target=payload.email,
    )
    return inv


def list_pending(db: Session, current_admin: User) -> list[Invitation]:
    return (
        db.query(Invitation)
        .filter(Invitation.company_id == current_admin.company_id, Invitation.status == "pending")
        .order_by(Invitation.created_at.desc())
        .all()
    )


def revoke(db: Session, current_admin: User, invitation_id: int) -> Invitation:
    inv = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not inv or inv.company_id != current_admin.company_id:
        raise HTTPException(404, "Invitation not found")
    if inv.status != "pending":
        raise HTTPException(409, "Only pending invitations can be revoked")
    inv.status = "revoked"
    db.commit()
    audit_controller.write_log(
        db, company_id=current_admin.company_id, user_name=current_admin.email,
        action="Invitation Revoked", target=inv.email,
    )
    return inv


def verify(db: Session, token: str) -> dict:
    inv = (
        db.query(Invitation)
        .filter(Invitation.token == token, Invitation.status == "pending")
        .first()
    )
    if not inv:
        raise HTTPException(404, "Invalid or expired invitation")
    company = db.query(Company).filter(Company.id == inv.company_id).first()
    return {"email": inv.email, "role": inv.role, "company_name": company.name if company else ""}


def accept(db: Session, payload: InviteAccept) -> dict:
    inv = (
        db.query(Invitation)
        .filter(Invitation.token == payload.token, Invitation.status == "pending")
        .first()
    )
    if not inv:
        raise HTTPException(404, "Invalid or expired invitation")
    if db.query(User).filter(User.email == inv.email).first():
        raise HTTPException(409, "An account already exists for this email")
    if len(payload.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    user = User(
        email=inv.email, hashed_password=hash_password(payload.password),
        role=inv.role, company_id=inv.company_id, is_active=True,
    )
    db.add(user)
    inv.status = "accepted"
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}
