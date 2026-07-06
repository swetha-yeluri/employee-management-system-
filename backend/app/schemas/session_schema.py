
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SessionOut(BaseModel):
    id: int
    user_email: str
    device_name: Optional[str] = None
    browser: Optional[str] = None
    ip: Optional[str] = None
    status: str
    is_trusted: bool
    termination_reason: Optional[str] = None
    login_at: datetime
    last_activity_at: datetime

    class Config:
        from_attributes = True


class RenameRequest(BaseModel):
    device_name: str = Field(..., min_length=1)