"""Application user: authentication, role-based access, lifecycle flags
(Improvement 6), attendance access (Improvement 7), and activity tracking
(Improvement 9 — last login/logout, browser, IP, new-device/IP flags).
"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # admin | user
    company_id = Column(Integer, ForeignKey("companies.id"))
    is_active = Column(Boolean, default=True)
    deactivated_by = Column(String, nullable=True)
    attendance_access = Column(Boolean, default=False)

    # Suspension (Improvement 11) — login allowed but all modules blocked
    is_suspended = Column(Boolean, default=False)
    suspended_by = Column(String, nullable=True)
    suspended_at = Column(DateTime, nullable=True)
    suspension_reason = Column(String, nullable=True)

    # Activity tracking (Improvement 9)
    last_login = Column(DateTime, nullable=True)
    last_logout = Column(DateTime, nullable=True)
    last_browser = Column(String, nullable=True)
    last_ip = Column(String, nullable=True)
    last_login_new_device = Column(Boolean, default=False)
    last_login_new_ip = Column(Boolean, default=False)

    company = relationship("Company", back_populates="users")
