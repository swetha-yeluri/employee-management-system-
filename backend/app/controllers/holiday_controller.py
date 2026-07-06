
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.holiday_model import Holiday


def list_holidays(db: Session, company_id: int):
    return (
        db.query(Holiday)
        .filter(Holiday.company_id == company_id)
        .order_by(Holiday.date)
        .all()
    )


def create_holiday(db: Session, admin, payload):
    
    exists = (
        db.query(Holiday)
        .filter(Holiday.company_id == admin.company_id, Holiday.date == payload.date)
        .first()
    )
    if exists:
        raise HTTPException(409, "A holiday already exists on that date")

    holiday = Holiday(
        company_id=admin.company_id, name=payload.name, date=payload.date,
        description=payload.description, holiday_type=payload.holiday_type,
        is_recurring=payload.is_recurring, created_by=admin.email,
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    audit_controller.write_log(db, company_id=admin.company_id, user_name=admin.email,
        action="Holiday Created", target=f"{holiday.name} ({holiday.date})")
    return holiday


def _get(db, admin, holiday_id):
    h = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not h or h.company_id != admin.company_id:
        raise HTTPException(404, "Holiday not found")
    return h


def update_holiday(db: Session, admin, holiday_id, payload):
    h = _get(db, admin, holiday_id)
    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(h, field, value)
    db.commit()
    db.refresh(h)
    audit_controller.write_log(db, company_id=admin.company_id, user_name=admin.email,
        action="Holiday Updated", target=f"{h.name} ({h.date})")
    return h


def delete_holiday(db: Session, admin, holiday_id):
    h = _get(db, admin, holiday_id)
    name, date = h.name, h.date
    db.delete(h)
    db.commit()
    audit_controller.write_log(db, company_id=admin.company_id, user_name=admin.email,
        action="Holiday Deleted", target=f"{name} ({date})")
    return {"message": "Holiday deleted"}


def is_holiday(db: Session, company_id: int, date_str: str) -> bool:
    """Attendance integration: is this date a holiday for the company?"""
    month_day = date_str[5:]   # 'MM-DD' (recurring check)
    holidays = db.query(Holiday).filter(Holiday.company_id == company_id).all()
    for h in holidays:
        if h.date == date_str:
            return True
        if h.is_recurring and h.date[5:] == month_day:   # recurring: same MM-DD any year
            return True
    return False