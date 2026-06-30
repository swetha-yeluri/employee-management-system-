
PROFILE_FIELDS = [
    ("first_name", "First Name"),
    ("last_name", "Last Name"),
    ("email", "Email"),
    ("phone", "Phone Number"),
    ("department_id", "Department"),
    ("position", "Designation"),
    ("profile_picture", "Profile Picture"),
    ("address", "Address"),
    ("date_of_joining", "Date of Joining"),
    ("employee_code", "Employee ID"),
]


def compute_completion(employee) -> dict:
    filled = 0
    missing = []
    for attr, label in PROFILE_FIELDS:
        value = getattr(employee, attr, None)
        if value is not None and str(value).strip() != "":
            filled += 1                 
        else:
            missing.append(label)       
    total = len(PROFILE_FIELDS)         
    percent = round(filled / total * 100)
    return {"percent": percent, "filled": filled, "total": total, "missing": missing}