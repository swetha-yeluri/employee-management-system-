
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.attendance_access_request_model import AttendanceAccessRequest
from app.models.attendance_record_model import AttendanceRecord
from app.models.user_model import User


def _display_name(email: str) -> str:
    return email.split("@")[0].replace(".", " ").title()


# ---------- access ----------
def get_access_status(db: Session, user: User) -> dict:
    """Returns the user's attendance access status. On the FIRST call for a user
    with no access and no existing request, auto-creates a pending request."""
    if user.attendance_access:
        latest = (
            db.query(AttendanceAccessRequest)
            .filter(AttendanceAccessRequest.user_id == user.id,
                    AttendanceAccessRequest.status == "approved")
            .order_by(AttendanceAccessRequest.created_at.desc())
            .first()
        )
        return {"has_access": True, "status": "approved",
                "submitted_on": latest.created_at if latest else None}

    existing = (
        db.query(AttendanceAccessRequest)
        .filter(AttendanceAccessRequest.user_id == user.id)
        .order_by(AttendanceAccessRequest.created_at.desc())
        .first()
    )
    if existing and existing.status in ("pending", "rejected"):
        return {"has_access": False, "status": existing.status,
                "submitted_on": existing.created_at}

    # No request yet -> auto-create one (requirement 3)
    req = AttendanceAccessRequest(
        company_id=user.company_id, user_id=user.id, user_email=user.email,
        user_name=_display_name(user.email), status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    audit_controller.write_log(
        db, company_id=user.company_id, user_name=user.email,
        action="Attendance Access Requested", target=user.email,
    )
    return {"has_access": False, "status": "pending", "submitted_on": req.created_at}


def list_pending_access(db: Session, admin: User):
    return (
        db.query(AttendanceAccessRequest)
        .filter(AttendanceAccessRequest.company_id == admin.company_id,
                AttendanceAccessRequest.status == "pending")
        .order_by(AttendanceAccessRequest.created_at.desc())
        .all()
    )


def _get_req(db, admin, req_id):
    req = db.query(AttendanceAccessRequest).filter(
        AttendanceAccessRequest.id == req_id).first()
    if not req or req.company_id != admin.company_id:
        raise HTTPException(404, "Request not found")
    if req.status != "pending":
        raise HTTPException(409, "Request already processed")
    return req


def approve_access(db: Session, admin: User, req_id: int):
    req = _get_req(db, admin, req_id)
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.attendance_access = True
    req.status = "approved"
    req.decided_by = admin.email
    req.decided_at = datetime.utcnow()
    db.commit()
    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action="Attendance Access Approved", target=req.user_email,
    )
    return req


def reject_access(db: Session, admin: User, req_id: int):
    req = _get_req(db, admin, req_id)
    req.status = "rejected"
    req.decided_by = admin.email
    req.decided_at = datetime.utcnow()
    db.commit()
    audit_controller.write_log(
        db, company_id=admin.company_id, user_name=admin.email,
        action="Attendance Access Rejected", target=req.user_email,
    )
    return req


# ---------- check-in / check-out ----------
def _today_open_record(db, user):
    today = datetime.utcnow().date().isoformat()
    return (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == user.id,
                AttendanceRecord.work_date == today,
                AttendanceRecord.check_out.is_(None))
        .first()
    )


def _today_record(db, user):
    today = datetime.utcnow().date().isoformat()
    return (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == user.id,
                AttendanceRecord.work_date == today)
        .order_by(AttendanceRecord.check_in.desc())
        .first()
    )


def check_in(db: Session, user: User):
    if _today_open_record(db, user):
        raise HTTPException(409, "You are already checked in")
    rec = AttendanceRecord(
        company_id=user.company_id, user_id=user.id,
        work_date=datetime.utcnow().date().isoformat(),
        check_in=datetime.utcnow(),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    audit_controller.write_log(
        db, company_id=user.company_id, user_name=user.email,
        action="Check-In", target=user.email,
    )
    return rec


def check_out(db: Session, user: User):
    rec = _today_open_record(db, user)
    if not rec:
        raise HTTPException(409, "You are not checked in")
    rec.check_out = datetime.utcnow()
    rec.work_hours = round((rec.check_out - rec.check_in).total_seconds() / 3600, 2)
    db.commit()
    db.refresh(rec)
    audit_controller.write_log(
        db, company_id=user.company_id, user_name=user.email,
        action="Check-Out", target=user.email,
    )
    return rec


def get_today(db: Session, user: User) -> dict:
    rec = _today_record(db, user)
    return {
        "checked_in": rec is not None,
        "checked_out": bool(rec and rec.check_out),
        "record": rec,
    }


def get_history(db: Session, user: User, limit: int = 30):
    return (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == user.id)
        .order_by(AttendanceRecord.check_in.desc())
        .limit(limit)
        .all()
    )


def get_summary(db: Session, user: User) -> dict:
    records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == user.id)
        .all()
    )
    total = round(sum(r.work_hours or 0 for r in records), 2)
    days = len({r.work_date for r in records})
    return {"total_hours": total, "days": days}
