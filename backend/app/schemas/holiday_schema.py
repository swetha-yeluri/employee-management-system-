
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class HolidayCreate(BaseModel):
    name: str = Field(..., min_length=1)          # mandatory
    date: str = Field(..., min_length=1)          # mandatory (YYYY-MM-DD)
    description: Optional[str] = None
    holiday_type: str = "Public Holiday"
    is_recurring: bool = False


class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    holiday_type: Optional[str] = None
    is_recurring: Optional[bool] = None


class HolidayOut(BaseModel):
    id: int
    name: str
    date: str
    description: Optional[str] = None
    holiday_type: str
    is_recurring: bool
    created_by: Optional[str] = None

    class Config:
        from_attributes = True