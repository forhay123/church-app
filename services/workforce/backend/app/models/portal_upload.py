from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, Enum, DateTime, Text
from datetime import datetime
from app.db.base import Base
import enum


class UploadType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    LINK = "link"


class PortalUpload(Base):
    __tablename__ = "portal_uploads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[UploadType] = mapped_column(Enum(UploadType), nullable=False)

    # File-related fields
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Link field (if type == "link")
    link_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relations
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    church_id: Mapped[int | None] = mapped_column(ForeignKey("churches.id"), nullable=True)

    uploaded_by = relationship("User", back_populates="portal_uploads")
    department = relationship("Department", back_populates="portal_uploads")
    church = relationship("Church", back_populates="portal_uploads")
