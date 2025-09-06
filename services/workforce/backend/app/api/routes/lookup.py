from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from typing import List

from app.db.session import get_db
from app.models.user import Role
from app.models.church import Church
from app.models.department import Department
from app.schemas.lookup import ChurchSchema, DepartmentSchema

router = APIRouter(prefix="/lookup", tags=["lookup"])

# Existing endpoint
@router.get("/churches", response_model=List[ChurchSchema])
def get_churches(db: Session = Depends(get_db)):
    return db.query(Church).all()

# Existing endpoint
@router.get("/departments", response_model=List[DepartmentSchema])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

# **New endpoint for unique department names**
@router.get("/departments/names", response_model=List[str])
def get_unique_department_names(db: Session = Depends(get_db)):
    names = db.query(distinct(Department.name)).all()
    return [n[0] for n in names]

# Existing roles endpoint
@router.get("/roles", response_model=List[str])
def get_roles():
    return [role.value for role in Role]
