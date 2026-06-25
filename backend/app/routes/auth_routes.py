"""Authentication endpoints: login, signup, forgot/reset password, profile,
and logout. Login/logout capture IP + browser for activity tracking.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.controllers import auth_controller as ctrl
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.auth_schema import (
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _client(request: Request) -> tuple[str, str]:
    ip = request.client.host if request.client else ""
    browser = request.headers.get("user-agent", "")
    return ip, browser


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip, browser = _client(request)
    return ctrl.authenticate(db, payload, ip=ip, browser=browser)


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    return ctrl.signup(db, payload)


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    ip, browser = _client(request)
    return ctrl.logout(db, current_user, ip=ip, browser=browser)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return ctrl.reset_password(db, payload)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
