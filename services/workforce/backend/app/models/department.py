from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey
from app.db.base import Base

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    church_id: Mapped[int] = mapped_column(ForeignKey("churches.id"))

    church = relationship("Church", back_populates="departments")
    members = relationship("User", back_populates="department")
    portal_uploads = relationship("PortalUpload", back_populates="department", cascade="all, delete-orphan")
