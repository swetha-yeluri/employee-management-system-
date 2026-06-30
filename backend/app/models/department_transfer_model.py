
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class DepartmentTransfer(Base):
    __tablename__ = "department_transfers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    employee_id = Column(Integer, nullable=False)
    employee_name = Column(String, nullable=False)
    from_department = Column(String, nullable=False)
    to_department = Column(String, nullable=False)
    transferred_by = Column(String, nullable=False)   # admin email
    created_at = Column(DateTime, default=datetime.utcnow)
