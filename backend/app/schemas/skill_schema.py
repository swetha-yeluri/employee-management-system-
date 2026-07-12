
from typing import Optional
from pydantic import BaseModel, Field


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1)          
    proficiency: str = "Beginner"
    years_experience: int = Field(0, ge=0)        
    is_primary: bool = False


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    proficiency: Optional[str] = None
    years_experience: Optional[int] = Field(None, ge=0)
    is_primary: Optional[bool] = None


class SkillOut(BaseModel):
    id: int
    employee_id: int
    name: str
    proficiency: str
    years_experience: int
    is_primary: bool

    class Config:
        from_attributes = True


class CertCreate(BaseModel):
    name: str = Field(..., min_length=1)
    issuing_org: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    document_name: Optional[str] = None


class CertUpdate(BaseModel):
    name: Optional[str] = None
    issuing_org: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    document_name: Optional[str] = None


class CertOut(BaseModel):
    id: int
    employee_id: int
    name: str
    issuing_org: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    document_name: Optional[str] = None
    status: str = "Valid"          

    class Config:
        from_attributes = True