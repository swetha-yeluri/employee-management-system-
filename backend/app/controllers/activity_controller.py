
from datetime import datetime

from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.login_activity_model import LoginActivity
from app.models.user_model import User


def _name_from_email(email: str) -> str:
    return email.split("@")[0].replace(".", " ").title()


def record_login(db: Session, user: User, ip: str, browser: str) -> None:
    prior = (
        db.query(LoginActivity)
        .filter(LoginActivity.user_id == user.id, LoginActivity.event == "login")
        .all()
    )
    known_browsers = {a.browser for a in prior if a.browser}
    known_ips = {a.ip for a in prior if a.ip}

    # First-ever login establishes the baseline (not flagged as "new").
    is_new_device = bool(known_browsers) and browser not in known_browsers
    is_new_ip = bool(known_ips) and ip not in known_ips

    now = datetime.utcnow()
    user.last_login = now
    user.last_browser = browser
    user.last_ip = ip
    user.last_login_new_device = is_new_device
    user.last_login_new_ip = is_new_ip

    db.add(LoginActivity(
        company_id=user.company_id, user_id=user.id, user_email=user.email,
        event="login", browser=browser, ip=ip,
        is_new_device=is_new_device, is_new_ip=is_new_ip,
    ))
    db.commit()

    audit_controller.write_log(
        db, company_id=user.company_id, user_name=user.email,
        action="User Login", target=ip or "",
    )
    if is_new_device:
        audit_controller.write_log(
            db, company_id=user.company_id, user_name=user.email,
            action="New Device Detected", target=browser or "",
        )
    if is_new_ip:
        audit_controller.write_log(
            db, company_id=user.company_id, user_name=user.email,
            action="New IP Address Detected", target=ip or "",
        )


def record_logout(db: Session, user: User, ip: str, browser: str) -> None:
    user.last_logout = datetime.utcnow()
    db.add(LoginActivity(
        company_id=user.company_id, user_id=user.id, user_email=user.email,
        event="logout", browser=browser, ip=ip,
    ))
    db.commit()
    audit_controller.write_log(
        db, company_id=user.company_id, user_name=user.email,
        action="User Logout", target=ip or "",
    )


def list_activity(db: Session, admin: User) -> list[dict]:
    users = (
        db.query(User)
        .filter(User.company_id == admin.company_id)
        .order_by(User.email)
        .all()
    )
    return [
        {
            "user_id": u.id,
            "user_name": _name_from_email(u.email),
            "email": u.email,
            "last_login": u.last_login,
            "last_logout": u.last_logout,
            "browser": u.last_browser,
            "ip": u.last_ip,
            "new_device": bool(u.last_login_new_device),
            "new_ip": bool(u.last_login_new_ip),
        }
        for u in users
    ]
