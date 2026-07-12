
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    name = Column(String, nullable=False)                    
    issuing_org = Column(String, nullable=True)              
    issue_date = Column(String, nullable=True)               
    expiry_date = Column(String, nullable=True)     
    document_name = Column(String, nullable=True)            
    created_at = Column(DateTime, default=datetime.utcnow)