
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import activity_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.activity_schema import ActivityOut
from app.utils.deps import require_admin

router = APIRouter(prefix="/api/activity", tags=["Activity"])


@router.get("", response_model=list[ActivityOut])
def activity(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return ctrl.list_activity(db, current_admin)
