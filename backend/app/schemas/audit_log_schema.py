"""Schema for returning audit log entries."""
from datetime import datetime

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    user_name: str
    action: str
    target: str
    timestamp: datetime

    class Config:
        from_attributes = True
