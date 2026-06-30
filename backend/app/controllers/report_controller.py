
import csv
import io

from sqlalchemy.orm import Session

from app.models.employee_model import Employee


def build_attendance_csv(db: Session, company_id: int) -> str:
    employees = (
        db.query(Employee)
        .filter(Employee.company_id == company_id)
        .order_by(Employee.name)
        .all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "Name", "Email", "Department", "Status", "Attendance"])
    for emp in employees:
        attendance = "Present" if emp.status == "Active" else emp.status
        writer.writerow(
            [
                emp.id,
                emp.name,
                emp.email,
                emp.department.name if emp.department else "Unassigned",
                emp.status,
                attendance,
            ]
        )
    return buffer.getvalue()
