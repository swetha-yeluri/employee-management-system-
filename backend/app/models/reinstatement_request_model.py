
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class ReinstatementRequest(Base):
    __tablename__ = "reinstatement_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    reason = Column(String, nullable=False)            # user's comment
    suspended_by = Column(String, nullable=True)       # admin to notify
    status = Column(String, default="pending")          # pending | approved | rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_by = Column(String, nullable=True)
