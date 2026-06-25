"""Schema for returning company members."""
from pydantic import BaseModel, EmailStr


class MemberOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool
    is_suspended: bool = False

    class Config:
        from_attributes = True
