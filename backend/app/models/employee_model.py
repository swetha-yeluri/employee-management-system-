"""Employee table - the core domain model. Scoped to a company so users only
ever see employees from their own company.
"""
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    position = Column(String, nullable=False)  # shown as "Role" in the UI
    status = Column(String, default="Active")  # Active | Inactive | On Leave
    department_id = Column(Integer, ForeignKey("departments.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))

    department = relationship("Department", back_populates="employees")
    company = relationship("Company", back_populates="employees")
