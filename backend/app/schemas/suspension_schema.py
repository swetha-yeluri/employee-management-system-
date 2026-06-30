
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SuspendRequest(BaseModel):
    reason: str = Field(..., min_length=3)


class SuspensionStatusOut(BaseModel):
    is_suspended: bool
    status: str                         # Active | Suspended | Deactivated
    suspended_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    suspended_by: Optional[str] = None


class ReinstatementCreate(BaseModel):
    reason: str = Field(..., min_length=3)


class ReinstatementOut(BaseModel):
    id: int
    user_email: str
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
