"""Analytics dashboard endpoint. Returns KPI counts + chart data, scoped to
the caller's company.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import analytics_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.analytics_schema import AnalyticsOut
from app.utils.deps import require_active_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    return ctrl.get_analytics(db, current_user.company_id)
