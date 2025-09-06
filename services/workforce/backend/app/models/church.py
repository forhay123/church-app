from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, Integer
from app.db.base import Base

class Church(Base):
    __tablename__ = "churches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    location: Mapped[str] = mapped_column(String(255))

    departments = relationship("Department", back_populates="church")
    members = relationship("User", back_populates="church")
    portal_uploads = relationship("PortalUpload", back_populates="church", cascade="all, delete-orphan")
    finances = relationship("Finance", back_populates="church", cascade="all, delete-orphan")