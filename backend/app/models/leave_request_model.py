"""A leave request submitted by a user, reviewed by company admins."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    leave_type = Column(String, nullable=False)       # Sick | Casual | Earned | Other
    start_date = Column(String, nullable=False)       # YYYY-MM-DD
    end_date = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="pending")        # pending | approved | rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_by = Column(String, nullable=True)
