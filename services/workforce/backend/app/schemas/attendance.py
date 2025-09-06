# backend/app/schemas/attendance.py
from pydantic import BaseModel, validator
from datetime import date
from typing import List, Literal, Optional

# ---------------- Status Literal ----------------
Status = Literal["PRESENT", "ABSENT", "LATE"]

# ---------------- Input for bulk marking ----------------
class AttendanceRecord(BaseModel):
    user_id: int
    status: Optional[str] = None
    on_duty: Optional[bool] = None

    @validator("status", pre=True)
    def normalize_status(cls, v):
        if v is None:
            return None
        v_upper = str(v).upper()
        if v_upper not in ("PRESENT", "ABSENT", "LATE"):
            raise ValueError("Status must be PRESENT, ABSENT, or LATE")
        return v_upper

# Ensure that at least one of status or on_duty is provided
class AttendanceRecordCreate(BaseModel):
    user_id: int
    status: Optional[str] = None
    on_duty: Optional[bool] = None

    @validator('status', always=True)
    def check_at_least_one_field(cls, v, values):
        if v is None and values.get('on_duty') is None:
            raise ValueError('Either status or on_duty must be provided')
        return v

class AttendanceBulkCreate(BaseModel):
    date: date
    records: List[AttendanceRecordCreate]


# ---------------- Output schema ----------------
class AttendanceOut(BaseModel):
    id: Optional[int]
    user_id: int
    user_name: Optional[str]
    date: Optional[date]
    status: Optional[Status]
    on_duty: Optional[bool] = False
    church_id: Optional[int]
    department_id: Optional[int]

    class Config:
        from_attributes = True # Use this instead of orm_mode=True