
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AccessStatusOut(BaseModel):
    has_access: bool
    status: str                       
    submitted_on: Optional[datetime] = None


class AccessRequestOut(BaseModel):
    id: int
    user_name: str
    user_email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecordOut(BaseModel):
    id: int
    work_date: str
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    work_hours: Optional[float] = None

    class Config:
        from_attributes = True


class TodayOut(BaseModel):
    checked_in: bool
    checked_out: bool
    record: Optional[RecordOut] = None


class SummaryOut(BaseModel):
    total_hours: float
    days: int
