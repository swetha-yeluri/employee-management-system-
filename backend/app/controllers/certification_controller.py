"""Certification logic (Task 16): CRUD + status compute + expiry notify + document upload + audit."""
import os
import shutil
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers import audit_controller, notification_controller
from app.models.certification_model import Certification

ALLOWED_FORMATS = (".pdf", ".png", ".jpg", ".jpeg")
UPLOAD_DIR = "uploads/certifications"


def _employee_of(user, db):
    from app.models.employee_model import Employee
    emp = db.query(Employee).filter(
        Employee.company_id == user.company_id, Employee.email == user.email
    ).first()
    if not emp:
        raise HTTPException(404, "No employee profile linked to your account")
    return emp


def compute_status(cert) -> str:
    """Valid / Expired / Expiring Soon (30 days)."""
    if not cert.expiry_date:
        return "Valid"
    try:
        expiry = datetime.strptime(cert.expiry_date, "%Y-%m-%d")
    except ValueError:
        return "Valid"
    today = datetime.utcnow()
    if expiry < today:
        return "Expired"
    if expiry <= today + timedelta(days=30):
        return "Expiring Soon"
    return "Valid"


def _out(cert):
    cert.status = compute_status(cert)
    return cert


def _validate_document(document_name):
    if document_name and not document_name.lower().endswith(ALLOWED_FORMATS):
        raise HTTPException(400, "Only PDF, PNG, JPG files are allowed")


def _validate_dates(issue_date, expiry_date):
    if issue_date and expiry_date and expiry_date < issue_date:
        raise HTTPException(400, "Expiry date cannot be earlier than issue date")


def list_my_certs(db: Session, user):
    emp = _employee_of(user, db)
    certs = db.query(Certification).filter(Certification.employee_id == emp.id).all()
    return [_out(c) for c in certs]


def add_cert(db: Session, user, payload):
    emp = _employee_of(user, db)
    exists = db.query(Certification).filter(
        Certification.employee_id == emp.id,
        Certification.name.ilike(payload.name),
        Certification.issuing_org == payload.issuing_org,
    ).first()
    if exists:
        raise HTTPException(409, "This certification already exists")

    _validate_dates(payload.issue_date, payload.expiry_date)
    _validate_document(payload.document_name)

    cert = Certification(
        company_id=user.company_id, employee_id=emp.id, name=payload.name,
        issuing_org=payload.issuing_org, issue_date=payload.issue_date,
        expiry_date=payload.expiry_date, document_name=payload.document_name,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Certification Added", target=cert.name)
    return _out(cert)


def _get_own_cert(db, user, cert_id):
    emp = _employee_of(user, db)
    c = db.query(Certification).filter(Certification.id == cert_id).first()
    if not c or c.employee_id != emp.id:
        raise HTTPException(404, "Certification not found")
    return c


def update_cert(db: Session, user, cert_id, payload):
    c = _get_own_cert(db, user, cert_id)
    data = payload.dict(exclude_unset=True)
    issue = data.get("issue_date", c.issue_date)
    expiry = data.get("expiry_date", c.expiry_date)
    _validate_dates(issue, expiry)
    if "document_name" in data:
        _validate_document(data["document_name"])
    for field, value in data.items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Certification Updated", target=c.name)
    return _out(c)


def delete_cert(db: Session, user, cert_id):
    c = _get_own_cert(db, user, cert_id)
    name = c.name
    db.delete(c)
    db.commit()
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Certification Deleted", target=name)
    return {"message": "Certification deleted"}


def upload_document(db, user, cert_id, file):
    """Real file upload (Task 16): validate format, save to disk, store filename."""
    c = _get_own_cert(db, user, cert_id)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_FORMATS:
        raise HTTPException(400, "Only PDF, PNG, JPG files are allowed")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_name = f"cert_{cert_id}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, saved_name)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    c.document_name = saved_name
    db.commit()
    db.refresh(c)
    audit_controller.write_log(db, company_id=user.company_id, user_name=user.email,
        action="Certification Updated", target=f"{c.name} (document uploaded)")
    return _out(c)


def check_expiries(db: Session, user):
    """Notify for certs expiring in 30 days or already expired (Task 16)."""
    emp = _employee_of(user, db)
    certs = db.query(Certification).filter(Certification.employee_id == emp.id).all()
    for c in certs:
        status = compute_status(c)
        if status == "Expiring Soon":
            notification_controller.notify_email(db, company_id=user.company_id,
                email=user.email, message=f"Certification '{c.name}' is expiring soon.")
        elif status == "Expired":
            notification_controller.notify_email(db, company_id=user.company_id,
                email=user.email, message=f"Certification '{c.name}' has expired.")