
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean

from app.database.connection import Base


class LoginSession(Base):
    __tablename__ = "login_sessions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    session_token = Column(String, unique=True, index=True, nullable=False)  
    device_name = Column(String, nullable=True)         
    browser = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    status = Column(String, default="active")           
    is_trusted = Column(Boolean, default=False)
    termination_reason = Column(String, nullable=True)  
    login_at = Column(DateTime, default=datetime.utcnow)
    last_activity_at = Column(DateTime, default=datetime.utcnow)