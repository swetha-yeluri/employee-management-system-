
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    position = Column(String, nullable=False)  
    status = Column(String, default="Active")  
    department_id = Column(Integer, ForeignKey("departments.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    
    first_name = Column(String, nullable=True)        
    last_name = Column(String, nullable=True)         
    phone = Column(String, nullable=True)             
    profile_picture = Column(String, nullable=True)   
    address = Column(String, nullable=True)           
    date_of_joining = Column(String, nullable=True)   
    employee_code = Column(String, nullable=True)     

    department = relationship("Department", back_populates="employees")
    company = relationship("Company", back_populates="employees")
