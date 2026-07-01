
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import holiday_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.holiday_schema import HolidayCreate, HolidayUpdate, HolidayOut
from app.utils.deps import require_active_user, require_admin

router = APIRouter(prefix="/api/holidays", tags=["Holidays"])


@router.get("", response_model=list[HolidayOut])
def list_holidays(db: Session = Depends(get_db),
                  current_user: User = Depends(require_active_user)):
    
    return ctrl.list_holidays(db, current_user.company_id)


@router.post("", response_model=HolidayOut)
def create_holiday(payload: HolidayCreate, db: Session = Depends(get_db),
                   current_admin: User = Depends(require_admin)):
    return ctrl.create_holiday(db, current_admin, payload)


@router.put("/{holiday_id}", response_model=HolidayOut)
def update_holiday(holiday_id: int, payload: HolidayUpdate, db: Session = Depends(get_db),
                   current_admin: User = Depends(require_admin)):
    return ctrl.update_holiday(db, current_admin, holiday_id, payload)


@router.delete("/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db),
                   current_admin: User = Depends(require_admin)):
    return ctrl.delete_holiday(db, current_admin, holiday_id)