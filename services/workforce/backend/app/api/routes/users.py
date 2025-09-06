from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.user import User, Role
from app.models.department import Department
from app.models.church import Church
from app.api.deps import get_current_user
from app.schemas.user import UserUpdate, UserOut
from app.schemas.org import ChurchOut, DepartmentOut
from typing import List
import os
import shutil
import time

router = APIRouter(prefix="/users", tags=["users"])

# ---------------- BASE UPLOAD PATH ----------------
UPLOADS_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "users")
os.makedirs(UPLOADS_BASE_DIR, exist_ok=True)

# ---------------- ALL USERS ----------------
@router.get("/", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).options(
        joinedload(User.department),
        joinedload(User.church)
    ).all()

# ---------------- SELF PROFILE ----------------
@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).options(
        joinedload(User.department),
        joinedload(User.church)
    ).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ---------------- UPDATE USER ----------------
@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    update_data = user_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

# ---------------- UPLOAD PHOTO ----------------
@router.post("/{user_id}/upload-photo", response_model=UserOut)
def upload_user_photo(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".gif"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    filename = f"user_{user_id}{file_ext}"
    file_path = os.path.join(UPLOADS_BASE_DIR, filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"[UPLOAD] Saved user photo to: {file_path}")

    # Public URL
    BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
    MOUNT_PREFIX = os.environ.get("BACKEND_MOUNT_PREFIX", "/workforce").rstrip("/")
    timestamp = int(time.time())
    user.photo_url = f"{BACKEND_URL}{MOUNT_PREFIX}/uploads/users/{filename}?t={timestamp}"

    db.commit()
    db.refresh(user)
    return user

# ---------------- LOOKUPS ----------------
@router.get("/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).options(joinedload(Department.church)).all()

@router.get("/churches", response_model=List[ChurchOut])
def get_churches(db: Session = Depends(get_db)):
    return db.query(Church).all()

# ---------------- USERS BY ROLE ----------------
@router.get("/by-role/{role_name}", response_model=List[UserOut])
def get_users_by_role(role_name: str, db: Session = Depends(get_db)):
    try:
        role_enum = Role(role_name)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role specified")
    return db.query(User).filter(User.role == role_enum).all()
