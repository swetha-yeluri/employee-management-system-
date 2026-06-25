"""Audit log: an immutable record of important actions, scoped per company
for enterprise accountability and compliance.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_name = Column(String, nullable=False)   # who performed the action
    action = Column(String, nullable=False)       # e.g. "Employee Created"
    target = Column(String, default="")           # related employee/user
    timestamp = Column(DateTime, default=datetime.utcnow)
