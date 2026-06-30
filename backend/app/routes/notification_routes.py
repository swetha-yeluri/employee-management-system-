
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import notification_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.notification_schema import NotificationOut
from app.utils.deps import require_active_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationOut])
def my_notifications(db: Session = Depends(get_db),
                     current_user: User = Depends(require_active_user)):
    return ctrl.list_my(db, current_user)


@router.post("/read")
def mark_read(db: Session = Depends(get_db),
              current_user: User = Depends(require_active_user)):
    ctrl.mark_all_read(db, current_user)
    return {"message": "ok"}
