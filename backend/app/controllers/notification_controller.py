"""Personal notification helpers used by other modules (e.g. transfers)."""
from sqlalchemy.orm import Session

from app.models.notification_model import Notification
from app.models.user_model import User


def notify(db: Session, *, company_id: int, user_id: int, message: str) -> None:
    db.add(Notification(company_id=company_id, user_id=user_id, message=message, is_read=False))
    db.commit()


def notify_email(db: Session, *, company_id: int, email: str, message: str) -> bool:
    """Notify the user account matching an email (same company). Returns True if a
    user existed and was notified."""
    user = (
        db.query(User)
        .filter(User.email == email, User.company_id == company_id)
        .first()
    )
    if not user:
        return False
    notify(db, company_id=company_id, user_id=user.id, message=message)
    return True


def list_my(db: Session, user: User):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )


def mark_all_read(db: Session, user: User) -> None:
    (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.is_read == False)  # noqa: E712
        .update({"is_read": True})
    )
    db.commit()
