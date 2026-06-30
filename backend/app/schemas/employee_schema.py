from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    position: str = Field(..., min_length=2, max_length=80)
    status: str = Field(default="Active")
    department_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    address: Optional[str] = None
    date_of_joining: Optional[str] = None
    employee_code: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    """Payload for POST /employees."""


class EmployeeUpdate(BaseModel):
    """Payload for PUT /employees/{id} - every field optional for partial edits."""
    name: Optional[str] = Field(None, min_length=2, max_length=80)
    email: Optional[EmailStr] = None
    position: Optional[str] = Field(None, min_length=2, max_length=80)
    status: Optional[str] = None
    department_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    address: Optional[str] = None
    date_of_joining: Optional[str] = None
    employee_code: Optional[str] = None


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

class CompletionOut(BaseModel):
    percent: int
    filled: int
    total: int
    missing: list[str]