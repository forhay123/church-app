from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


# -------------------- BASE --------------------
class UserBase(BaseModel):
    name: str
    email: EmailStr
    address: Optional[str] = None
    birthday: Optional[date] = None
    phone: Optional[str] = None
    sex: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool = True


# -------------------- CREATE --------------------
class UserCreate(UserBase):
    password: str
    church_id: Optional[int] = None
    department_id: Optional[int] = None
    # ✅ leave gist_center_id optional, since assignment is admin’s job
    gist_center_id: Optional[int] = None  


# -------------------- UPDATE --------------------
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    church_id: Optional[int] = None
    department_id: Optional[int] = None
    gist_center_id: Optional[int] = None  # ✅ can be reassigned later
    address: Optional[str] = None
    birthday: Optional[date] = None
    phone: Optional[str] = None
    sex: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None      # ✅ allow toggling active status


# -------------------- OUTPUT --------------------
class UserOut(UserBase):
    id: int
    role: str
    church_id: Optional[int] = None
    department_id: Optional[int] = None
    gist_center_id: Optional[int] = None
    church_name: Optional[str] = None
    department_name: Optional[str] = None
    gist_center_name: Optional[str] = None

    class Config:
        from_attributes = True   # ✅ maps directly from SQLAlchemy ORM
