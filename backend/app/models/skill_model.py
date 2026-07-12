
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean

from app.database.connection import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    name = Column(String, nullable=False)                    
    proficiency = Column(String, default="Beginner")        
    years_experience = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)              
    created_at = Column(DateTime, default=datetime.utcnow)