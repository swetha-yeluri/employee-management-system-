
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ActivityOut(BaseModel):
    user_id: int
    user_name: str
    email: str
    last_login: Optional[datetime] = None
    last_logout: Optional[datetime] = None
    browser: Optional[str] = None
    ip: Optional[str] = None
    new_device: bool = False
    new_ip: bool = False


class TransferHistoryOut(BaseModel):
    id: int
    employee_name: str
    from_department: str
    to_department: str
    transferred_by: str
    created_at: datetime

    class Config:
        from_attributes = True
