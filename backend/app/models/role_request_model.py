"""Stores a user's request to be promoted to admin. Scoped to a company.
The request stays 'pending' until the specified admin approves or rejects it.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class RoleRequest(Base):
    __tablename__ = "role_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    requester_id = Column(Integer, nullable=False)
    requester_email = Column(String, nullable=False)
    admin_email = Column(String, nullable=False)
    requested_role = Column(String, default="admin")
    status = Column(String, default="pending")  # pending | approved | rejected
    created_at = Column(DateTime, default=datetime.utcnow)
