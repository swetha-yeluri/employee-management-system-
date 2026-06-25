"""A deactivated user's request to be reactivated, reviewed by the admin who
deactivated them.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class ReactivationRequest(Base):
    __tablename__ = "reactivation_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    admin_email = Column(String, nullable=False)   # reviewer (admin who deactivated)
    status = Column(String, default="pending")     # pending | approved | rejected
    created_at = Column(DateTime, default=datetime.utcnow)
