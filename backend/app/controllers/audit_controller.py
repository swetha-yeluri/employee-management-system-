
from sqlalchemy.orm import Session

from app.models.audit_log_model import AuditLog


def write_log(db: Session, *, company_id: int, user_name: str, action: str, target: str = "") -> None:
    db.add(
        AuditLog(
            company_id=company_id,
            user_name=user_name,
            action=action,
            target=target,
        )
    )
    db.commit()


def list_logs(db: Session, company_id: int) -> list[AuditLog]:
    return (
        db.query(AuditLog)
        .filter(AuditLog.company_id == company_id)
        .order_by(AuditLog.timestamp.desc())
        .all()
    )
