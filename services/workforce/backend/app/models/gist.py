# app/models/gist.py
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text
from datetime import datetime
from typing import Optional
from app.db.base import Base


class GistCenter(Base):
    __tablename__ = "gist_centers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    leader_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # ✅ specify foreign_keys to avoid ambiguity
    leader = relationship("User", back_populates="gist_center_led", foreign_keys=[leader_id])
    members = relationship("User", back_populates="gist_center", foreign_keys="User.gist_center_id")
    files = relationship("GistFile", back_populates="gist_center", cascade="all, delete-orphan")
    attendances = relationship("GistAttendance", back_populates="gist_center", cascade="all, delete-orphan")


class GistAttendance(Base):
    __tablename__ = "gist_attendance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    gist_center_id: Mapped[int] = mapped_column(ForeignKey("gist_centers.id"), nullable=False)
    attended_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="gist_attendance", foreign_keys=[user_id])
    gist_center = relationship("GistCenter", back_populates="attendances", foreign_keys=[gist_center_id])


class GistFile(Base):
    __tablename__ = "gist_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    gist_center_id: Mapped[int] = mapped_column(ForeignKey("gist_centers.id"), nullable=False)
    leader_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str] = mapped_column(String, nullable=False)  # image, pdf, video
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    gist_center = relationship("GistCenter", back_populates="files", foreign_keys=[gist_center_id])
    leader = relationship("User", foreign_keys=[leader_id])
