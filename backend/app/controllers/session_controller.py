
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.login_session_model import LoginSession

INACTIVITY_LIMIT = timedelta(minutes=30)   


def _device_name(browser: str) -> str:
    if not browser:
        return "Unknown device"
    if "Edg/" in browser:     return "Edge"
    if "OPR/" in browser:     return "Opera"
    if "Chrome/" in browser:  return "Chrome"
    if "Firefox/" in browser: return "Firefox"
    if "Safari/" in browser:  return "Safari"
    return "Browser"


def create_session(db: Session, user, ip: str = "", browser: str = "") -> LoginSession:
    session = LoginSession(
        company_id=user.company_id, user_id=user.id, user_email=user.email,
        session_token=secrets.token_urlsafe(32),
        device_name=_device_name(browser),
        browser=browser, ip=ip, status="active", is_trusted=True,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="User Login", target=f"{session.device_name} ({ip})")
    return session


def get_by_token(db: Session, token: str):
    return db.query(LoginSession).filter(LoginSession.session_token == token).first()


def touch(db: Session, session: LoginSession):
    session.last_activity_at = datetime.utcnow()
    db.commit()


def expire_stale(db: Session, company_id: int):
    """Task 15: mark inactive active-sessions as expired + audit."""
    cutoff = datetime.utcnow() - INACTIVITY_LIMIT
    stale = (db.query(LoginSession)
             .filter(LoginSession.company_id == company_id,
                     LoginSession.status == "active",
                     LoginSession.last_activity_at < cutoff)
             .all())
    for s in stale:
        s.status = "expired"
        s.termination_reason = "Session Expired"
        audit_controller.write_log(db, company_id=s.company_id, user_name=s.user_email,
            action="Session Expired", target=f"{s.device_name} ({s.user_email})")
    if stale:
        db.commit()


def list_my(db: Session, user):
    expire_stale(db, user.company_id)
    return (db.query(LoginSession).filter(LoginSession.user_id == user.id)
            .order_by(LoginSession.last_activity_at.desc()).all())


def list_all(db: Session, admin):
    expire_stale(db, admin.company_id)
    return (db.query(LoginSession).filter(LoginSession.company_id == admin.company_id)
            .order_by(LoginSession.last_activity_at.desc()).all())


def _get_own(db, user, session_id):
    s = db.query(LoginSession).filter(LoginSession.id == session_id).first()
    if not s or s.user_id != user.id:
        raise HTTPException(404, "Session not found")
    return s


def _get_company(db, admin, session_id):
    s = db.query(LoginSession).filter(LoginSession.id == session_id).first()
    if not s or s.company_id != admin.company_id:
        raise HTTPException(404, "Session not found")
    return s


def rename(db: Session, user, session_id, name):
    s = _get_own(db, user, session_id)
    s.device_name = name
    db.commit()
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Trusted Device Renamed", target=name)
    return s


def _end(db, s, actor_email, reason, action):
    if s.status != "active":
        raise HTTPException(409, "Session is already ended")
    s.status = "revoked" if reason in ("Force Logout", "Revoked") else "logged_out"
    s.termination_reason = reason
    db.commit()
    audit_controller.write_log(db, company_id=s.company_id, user_name=actor_email,
        action=action, target=f"{s.device_name} ({s.user_email})")
    return s


def logout_session(db: Session, user, session_id):
    s = _get_own(db, user, session_id)
    return _end(db, s, user.email, "User Logout", "User Logout")


def logout_others(db: Session, user, current_token):
    sessions = (db.query(LoginSession)
                .filter(LoginSession.user_id == user.id, LoginSession.status == "active").all())
    count = 0
    for s in sessions:
        if s.session_token != current_token:
            s.status = "logged_out"
            s.termination_reason = "User Logout"
            count += 1
    db.commit()
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="User Logout", target=f"Logged out {count} other device(s)")
    return {"logged_out": count}


def force_logout(db: Session, admin, session_id):
    s = _get_company(db, admin, session_id)
    return _end(db, s, admin.email, "Force Logout", "Force Logout Initiated")


def revoke(db: Session, admin, session_id):
    s = _get_company(db, admin, session_id)
    return _end(db, s, admin.email, "Revoked", "Session Revoked")