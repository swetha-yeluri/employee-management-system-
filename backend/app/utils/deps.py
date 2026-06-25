"""Reusable FastAPI dependencies for authentication and access control.

- get_current_user: any valid token (even a deactivated user) -> used by /me
  and the reactivation endpoints so deactivated users can still act.
- require_active_user: must be logged in AND active -> used by feature reads.
- require_admin: must be active AND an admin -> used by all admin actions.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user_model import User
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise _credentials_error
    user = db.query(User).filter(User.email == payload["sub"]).first()
    if user is None:
        raise _credentials_error
    return user


def require_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    # Suspension gate (Improvement 11): suspended users can log in and reach
    # /me + reinstatement endpoints (those use get_current_user), but every
    # protected business/admin action is blocked here.
    if current_user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )
    return current_user


def require_admin(current_user: User = Depends(require_active_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this action",
        )
    return current_user


def require_attendance_access(current_user: User = Depends(require_active_user)) -> User:
    """Gate the attendance feature endpoints. The access-status endpoint itself
    uses require_active_user so a user can trigger their first request."""
    if not current_user.attendance_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Attendance access not granted yet",
        )
    return current_user
