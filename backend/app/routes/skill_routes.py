
import os
import shutil

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.controllers import skill_controller as skills
from app.controllers import certification_controller as certs
from app.database.connection import get_db
from app.models.user_model import User
from app.schemas.skill_schema import (
    SkillCreate, SkillUpdate, SkillOut, CertCreate, CertUpdate, CertOut,
)
from app.utils.deps import require_active_user, require_admin

router = APIRouter(prefix="/api", tags=["Skills & Certifications"])


# ---------- SKILLS (employee, own) ----------
@router.get("/skills/mine", response_model=list[SkillOut])
def my_skills(db: Session = Depends(get_db), user: User = Depends(require_active_user)):
    return skills.list_my_skills(db, user)


@router.post("/skills", response_model=SkillOut)
def add_skill(payload: SkillCreate, db: Session = Depends(get_db),
              user: User = Depends(require_active_user)):
    return skills.add_skill(db, user, payload)


@router.put("/skills/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, payload: SkillUpdate, db: Session = Depends(get_db),
                 user: User = Depends(require_active_user)):
    return skills.update_skill(db, user, skill_id, payload)


@router.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db),
                 user: User = Depends(require_active_user)):
    return skills.delete_skill(db, user, skill_id)


# ---------- CERTIFICATIONS (employee, own) ----------
@router.get("/certifications/mine", response_model=list[CertOut])
def my_certs(db: Session = Depends(get_db), user: User = Depends(require_active_user)):
    certs.check_expiries(db, user)          # notify expiring/expired
    return certs.list_my_certs(db, user)


@router.post("/certifications", response_model=CertOut)
def add_cert(payload: CertCreate, db: Session = Depends(get_db),
             user: User = Depends(require_active_user)):
    return certs.add_cert(db, user, payload)


@router.put("/certifications/{cert_id}", response_model=CertOut)
def update_cert(cert_id: int, payload: CertUpdate, db: Session = Depends(get_db),
                user: User = Depends(require_active_user)):
    return certs.update_cert(db, user, cert_id, payload)


@router.delete("/certifications/{cert_id}")
def delete_cert(cert_id: int, db: Session = Depends(get_db),
                user: User = Depends(require_active_user)):
    return certs.delete_cert(db, user, cert_id)


@router.post("/certifications/{cert_id}/document", response_model=CertOut)
def upload_document(cert_id: int, file: UploadFile = File(...),
                    db: Session = Depends(get_db),
                    user: User = Depends(require_active_user)):
    return certs.upload_document(db, user, cert_id, file)


# ---------- ADMIN (all employees, search/filter) ----------
@router.get("/admin/competencies")
def admin_competencies(skill: str = "", level: str = "", min_experience: int = 0,
                       cert_name: str = "", cert_status: str = "",
                       db: Session = Depends(get_db),
                       admin: User = Depends(require_admin)):
    return skills.admin_competencies(db, admin, skill, level, min_experience,
                                     cert_name, cert_status)