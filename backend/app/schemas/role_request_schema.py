"""Schemas for the role-change request workflow."""
from datetime import datetime

from pydantic import BaseModel, EmailStr


class RoleRequestCreate(BaseModel):
    """User submits this to request promotion to admin."""
    current_password: str          # identity verification
    admin_email: EmailStr          # admin who should review the request


class RoleRequestOut(BaseModel):
    id: int
    requester_email: EmailStr
    admin_email: EmailStr
    requested_role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
