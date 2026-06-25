"""Response shapes for the analytics dashboard APIs."""
from pydantic import BaseModel


class CountItem(BaseModel):
    label: str
    count: int


class AnalyticsOut(BaseModel):
    total_employees: int
    active_employees: int
    total_departments: int
    pending_requests: int
    by_department: list[CountItem]
    by_role: list[CountItem]
    by_status: list[CountItem]
