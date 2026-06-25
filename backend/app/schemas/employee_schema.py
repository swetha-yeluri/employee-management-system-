"""Pydantic schemas validate incoming requests and shape outgoing JSON,
keeping the API contract separate from the database model.
"""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    position: str = Field(..., min_length=2, max_length=80)
    status: str = Field(default="Active")
    department_id: Optional[int] = None


class EmployeeCreate(EmployeeBase):
    """Payload for POST /employees."""


class EmployeeUpdate(BaseModel):
    """Payload for PUT /employees/{id} - every field optional for partial edits."""
    name: Optional[str] = Field(None, min_length=2, max_length=80)
    email: Optional[EmailStr] = None
    position: Optional[str] = Field(None, min_length=2, max_length=80)
    status: Optional[str] = None
    department_id: Optional[int] = None


class DepartmentOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class EmployeeOut(EmployeeBase):
    id: int
    department: Optional[DepartmentOut] = None

    class Config:
        from_attributes = True


class TransferRequest(BaseModel):
    department_id: int
