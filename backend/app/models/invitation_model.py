"""User invitation: a pending invite (with a token/link) to join a company."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    email = Column(String, nullable=False)
    role = Column(String, default="user")          # user | admin
    token = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, default="pending")     # pending | accepted | revoked
    invited_by = Column(String, nullable=False)    # admin email
    created_at = Column(DateTime, default=datetime.utcnow)
