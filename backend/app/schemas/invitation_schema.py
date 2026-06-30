
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class InvitationCreate(BaseModel):
    email: EmailStr
    role: Literal["admin", "user"] = "user"


class InvitationOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    token: str
    status: str
    invited_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class InviteVerifyOut(BaseModel):
    email: EmailStr
    role: str
    company_name: str


class InviteAccept(BaseModel):
    token: str
    password: str
