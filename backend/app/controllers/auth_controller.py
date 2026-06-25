"""Authentication business logic: login, signup, and password reset.
Signup attaches the new user to a company (created on demand).
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.controllers import activity_controller
from app.models.company_model import Company
from app.models.user_model import User
from app.schemas.auth_schema import LoginRequest, ResetPasswordRequest, SignupRequest
from app.utils.security import create_access_token, hash_password, verify_password


def _issue_token(user: User) -> dict:
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


def _get_or_create_company(db: Session, name: str) -> Company:
    company = db.query(Company).filter(Company.name == name).first()
    if not company:
        company = Company(name=name)
        db.add(company)
        db.commit()
        db.refresh(company)
    return company


def authenticate(db: Session, payload: LoginRequest, ip: str = "", browser: str = "") -> dict:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    activity_controller.record_login(db, user, ip=ip, browser=browser)
    return _issue_token(user)


def logout(db: Session, user: User, ip: str = "", browser: str = "") -> dict:
    activity_controller.record_logout(db, user, ip=ip, browser=browser)
    return {"message": "Logged out"}


def signup(db: Session, payload: SignupRequest) -> dict:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists",
        )

    company = _get_or_create_company(db, payload.company.strip())

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        company_id=company.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_token(user)


def reset_password(db: Session, payload: ResetPasswordRequest) -> dict:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email",
        )
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
