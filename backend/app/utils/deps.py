
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
    
    sid = payload.get("sid")
    if sid:
        from app.controllers import session_controller
        session = session_controller.get_by_token(db, sid)
        if session and session.status != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session ended. Please log in again.",
            )
        if session:
            session_controller.touch(db, session)
    return user


def require_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    
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