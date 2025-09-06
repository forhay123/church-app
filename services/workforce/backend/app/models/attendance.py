# backend/app/models/attendance.py
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, Date, String, ForeignKey, Boolean
from datetime import date
from app.db.base import Base

class AttendanceStatus:
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"

class Attendance(Base):
    __tablename__ = "attendance"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(10))
    on_duty: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    church_id: Mapped[int | None] = mapped_column(ForeignKey("churches.id"))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))

    # Relationship to the user who owns this attendance
    user = relationship("User", back_populates="attendances", foreign_keys=[user_id])

    # Optional: relationship to the creator/marker
    creator = relationship("User", foreign_keys=[created_by])