"""Schema for export history."""
from datetime import datetime
from pydantic import BaseModel


class ExportHistoryOut(BaseModel):
    id: int
    exported_by: str
    data_type: str
    file_format: str
    created_at: datetime

    class Config:
        from_attributes = True
