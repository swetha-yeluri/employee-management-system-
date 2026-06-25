"""History of data exports (who exported what, and when) — Improvement 10."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.connection import Base


class ExportHistory(Base):
    __tablename__ = "export_history"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    exported_by = Column(String, nullable=False)   # admin email
    data_type = Column(String, nullable=False)     # employees | attendance | ...
    file_format = Column(String, nullable=False)   # csv | excel | pdf
    created_at = Column(DateTime, default=datetime.utcnow)
