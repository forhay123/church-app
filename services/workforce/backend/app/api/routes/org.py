from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db

# 🟢 FIX: Corrected import to use the 'deps' module within the 'api' folder.
from app.api.deps import get_current_user

# Assuming these are your ORM models
from app.models.church import Church
from app.models.department import Department
from app.models.org import Group
from app.models.user import User
from app.models.attendance import Attendance

router = APIRouter(prefix="/org", tags=["Organization"])

# -----------------------
# GET Endpoints
# -----------------------

@router.get("/groups")
def get_groups(db: Session = Depends(get_db)):
    groups = db.query(Group).all()
    return [{"id": g.id, "name": g.name} for g in groups]

@router.get("/churches")
def get_all_churches(db: Session = Depends(get_db)):
    churches = db.query(Church).all()
    return [{"id": c.id, "name": c.name, "location": c.location} for c in churches]

@router.get("/departments")
def get_all_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [{"id": d.id, "name": d.name, "church_id": d.church_id} for d in depts]

# Fetch departments for a specific church
@router.get("/churches/{church_id}/departments")
def get_departments_by_church(church_id: int, db: Session = Depends(get_db)):
    departments = db.query(Department).filter(Department.church_id == church_id).all()
    return [{"id": d.id, "name": d.name, "church_id": d.church_id} for d in departments]

# -------------------------------------------------------------
# NEW & CORRECTED ENDPOINT TO GET MEMBERS FOR A LOGGED-IN LEADER
# -------------------------------------------------------------
@router.get("/my-department/members")
def get_my_department_members(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not user.department_id:
        raise HTTPException(status_code=400, detail="User is not assigned to a department")

    # Filter by both department and church
    members = db.query(User).filter(
        User.department_id == user.department_id,
        User.church_id == user.church_id
    ).all()
    
    return [
        {
            "id": m.id,
            "name": getattr(m, "name", None),
            "email": getattr(m, "email", None),
            "role": getattr(m, "role", None),
            "created_at": getattr(m, "created_at", None),
            "department_id": getattr(m, "department_id", None),
            "church_id": getattr(m, "church_id", None),
        }
        for m in members
    ]


# --------------------------------
# KEEPING THE OLD ENDPOINT FOR REFERENCE
# --------------------------------
@router.get("/departments/{department_id}/members")
def get_department_members(department_id: int, db: Session = Depends(get_db)):
    """
    Retrieves members of a department using a department ID from the URL.
    This can be used by an admin to view any department.
    """
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    members = db.query(User).filter(
        User.department_id == department_id,
        User.church_id == dept.church_id
    ).all()

    return [
        {
            "id": m.id,
            "name": getattr(m, "name", None),
            "email": getattr(m, "email", None),
            "role": getattr(m, "role", None),
            "created_at": getattr(m, "created_at", None),
            "department_id": getattr(m, "department_id", None),
            "church_id": getattr(m, "church_id", None),
        }
        for m in members
    ]


# 🆕 Fetch attendance of all members in a department
@router.get("/departments/{department_id}/attendance")
def get_department_members_attendance(
    department_id: int,
    db: Session = Depends(get_db),
    date: str | None = None  # optional date filter: YYYY-MM-DD
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    query = db.query(Attendance).join(User).filter(
        Attendance.department_id == department_id,
        Attendance.church_id == dept.church_id
    )

    if date:
        query = query.filter(Attendance.date == date)

    records = query.all()

    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "user_name": r.user.name if r.user else None,
            "date": r.date.isoformat() if r.date else None,
            "status": r.status,
        }
        for r in records
    ]

# -----------------------
# POST Endpoints
# -----------------------

@router.post("/churches")
def create_church(
    name: str = Body(...),
    location: str = Body(...),
    db: Session = Depends(get_db)
):
    church = Church(name=name, location=location)
    db.add(church)
    db.commit()
    db.refresh(church)
    return {"id": church.id, "name": church.name, "location": church.location}

@router.post("/departments")
def create_department(
    name: str = Body(...),
    church_id: int = Body(...),
    db: Session = Depends(get_db)
):
    church = db.query(Church).filter(Church.id == church_id).first()
    if not church:
        raise HTTPException(status_code=404, detail="Church not found")
    
    dept = Department(name=name, church_id=church_id)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": dept.id, "name": dept.name, "church_id": dept.church_id}

@router.post("/groups")
def create_group(
    name: str = Body(...),
    db: Session = Depends(get_db)
):
    group = Group(name=name)
    db.add(group)
    db.commit()
    db.refresh(group)
    return {"id": group.id, "name": group.name}
