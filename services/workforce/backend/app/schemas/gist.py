from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# ---------------- GIST CENTER ----------------
class GistCenterBase(BaseModel):
    name: str
    description: Optional[str] = None

class GistCenterCreate(GistCenterBase):
    leader_id: Optional[int] = None

class GistCenterOut(GistCenterBase):
    id: int
    leader_id: Optional[int] = None
    members: Optional[List["UserOut"]] = None

    class Config:
        from_attributes = True

# ---------------- ATTENDANCE ----------------
class GistAttendanceBase(BaseModel):
    gist_center_id: int

class GistAttendanceCreate(GistAttendanceBase):
    user_id: int

class GistAttendanceOut(GistAttendanceBase):
    id: int
    user_id: int
    attended_on: datetime

    class Config:
        from_attributes = True

# ---------------- FILES ----------------
class GistFileBase(BaseModel):
    gist_center_id: int
    file_type: str

class GistFileOut(GistFileBase):
    id: int
    leader_id: int
    file_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# 👇 put at the bottom
from app.schemas.user import UserOut
GistCenterOut.update_forward_refs()
