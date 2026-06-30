
from datetime import datetime
from pydantic import BaseModel, EmailStr


class ReactivationOut(BaseModel):
    id: int
    user_email: EmailStr
    admin_email: EmailStr
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
