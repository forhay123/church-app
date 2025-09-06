from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import date

class AttendanceQRCode(Base):
    __tablename__ = "attendance_qr"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    is_active = Column(Boolean, default=True)
    
    # Correct foreign key reference
    created_by = Column(Integer, ForeignKey("users.id"))

    # Bidirectional relationship
    creator = relationship("User", back_populates="generated_qrcodes")
