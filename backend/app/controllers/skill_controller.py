
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller
from app.models.skill_model import Skill


def _employee_of(user, db):
    """Find the employee record linked to this user (by email)."""
    from app.models.employee_model import Employee
    emp = db.query(Employee).filter(
        Employee.company_id == user.company_id, Employee.email == user.email
    ).first()
    if not emp:
        raise HTTPException(404, "No employee profile linked to your account")
    return emp


def list_my_skills(db: Session, user):
    emp = _employee_of(user, db)
    return db.query(Skill).filter(Skill.employee_id == emp.id).all()


def add_skill(db: Session, user, payload):
    emp = _employee_of(user, db)
    
    exists = db.query(Skill).filter(
        Skill.employee_id == emp.id, Skill.name.ilike(payload.name)
    ).first()
    if exists:
        raise HTTPException(409, "You already added this skill")

    skill = Skill(
        company_id=user.company_id, employee_id=emp.id, name=payload.name,
        proficiency=payload.proficiency, years_experience=payload.years_experience,
        is_primary=payload.is_primary,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Skill Added", target=skill.name)
    return skill


def _get_own_skill(db, user, skill_id):
    emp = _employee_of(user, db)
    s = db.query(Skill).filter(Skill.id == skill_id).first()
    if not s or s.employee_id != emp.id:
        raise HTTPException(404, "Skill not found")
    return s


def update_skill(db: Session, user, skill_id, payload):
    s = _get_own_skill(db, user, skill_id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Skill Updated", target=s.name)
    return s


def delete_skill(db: Session, user, skill_id):
    s = _get_own_skill(db, user, skill_id)
    name = s.name
    db.delete(s)
    db.commit()
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Skill Deleted", target=name)
    return {"message": "Skill deleted"}

def admin_competencies(db: Session, admin, skill="", level="", min_experience=0,
                       cert_name="", cert_status=""):
    """Admin: all employees' skills + certs, with search/filter (Task 16)."""
    from app.models.employee_model import Employee
    from app.models.certification_model import Certification
    from app.controllers import certification_controller

    employees = db.query(Employee).filter(Employee.company_id == admin.company_id).all()
    result = []
    for emp in employees:
        emp_skills = db.query(Skill).filter(Skill.employee_id == emp.id).all()
        emp_certs = db.query(Certification).filter(Certification.employee_id == emp.id).all()

        # skill filters
        if skill and not any(skill.lower() in s.name.lower() for s in emp_skills):
            continue
        if level and not any(s.proficiency == level for s in emp_skills):
            continue
        if min_experience and not any(s.years_experience >= min_experience for s in emp_skills):
            continue
        # cert filters
        if cert_name and not any(cert_name.lower() in c.name.lower() for c in emp_certs):
            continue
        if cert_status and not any(
            certification_controller.compute_status(c) == cert_status for c in emp_certs
        ):
            continue

        result.append({
            "employee_id": emp.id,
            "name": emp.name,
            "email": emp.email,
            "skills": [{"name": s.name, "proficiency": s.proficiency,
                        "years_experience": s.years_experience, "is_primary": s.is_primary}
                       for s in emp_skills],
            "certifications": [{"name": c.name, "issuing_org": c.issuing_org,
                                "status": certification_controller.compute_status(c)}
                               for c in emp_certs],
        })
    return result