
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean

from app.database.connection import Base


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))   # company-scoped
    name = Column(String, nullable=False)                       # mandatory
    date = Column(String, nullable=False)                       # YYYY-MM-DD (mandatory)
    description = Column(String, nullable=True)
    holiday_type = Column(String, default="Public Holiday")     # Public/Company/Optional
    is_recurring = Column(Boolean, default=False)               # annually recurring
    created_by = Column(String, nullable=True)                  # admin email
    created_at = Column(DateTime, default=datetime.utcnow)