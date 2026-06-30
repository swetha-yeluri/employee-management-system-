
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

RoleType = Literal["admin", "user"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: RoleType = "user"
    company: str = Field(..., min_length=2)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)


class CompanyOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool = True
    is_suspended: bool = False
    company: CompanyOut | None = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
