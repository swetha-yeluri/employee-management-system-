"""Schemas for leave requests."""
from datetime import datetime

from pydantic import BaseModel, Field


class LeaveCreate(BaseModel):
    leave_type: str = Field(..., min_length=2)
    start_date: str = Field(..., min_length=8)   # YYYY-MM-DD
    end_date: str = Field(..., min_length=8)
    reason: str = Field(..., min_length=3)


class LeaveOut(BaseModel):
    id: int
    user_email: str
    leave_type: str
    start_date: str
    end_date: str
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
