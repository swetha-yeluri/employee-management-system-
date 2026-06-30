
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class LoginActivity(Base):
    __tablename__ = "login_activities"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    event = Column(String, nullable=False)        # login | logout
    browser = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    is_new_device = Column(Boolean, default=False)
    is_new_ip = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
