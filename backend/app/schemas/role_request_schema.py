
from datetime import datetime

from pydantic import BaseModel, EmailStr


class RoleRequestCreate(BaseModel):
    
    current_password: str          
    admin_email: EmailStr          


class RoleRequestOut(BaseModel):
    id: int
    requester_email: EmailStr
    admin_email: EmailStr
    requested_role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
