from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, Enum, Date, Column, Boolean, DateTime
from app.core.roles import Role
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), index=True)

    # Email verification
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Password reset
    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_token_expiry: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)

    # Profile fields
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    birthday: Mapped[str | None] = mapped_column(String(10), nullable=True)  # e.g. "07-15"
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sex: Mapped[str | None] = mapped_column(String(10), nullable=True)       # "Male", "Female", etc.
    photo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    church_id: Mapped[int | None] = mapped_column(ForeignKey("churches.id"), nullable=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)

    church = relationship("Church", back_populates="members")
    department = relationship("Department", back_populates="members")

    attendances = relationship("Attendance", back_populates="user", foreign_keys="[Attendance.user_id]")
    generated_qrcodes = relationship("AttendanceQRCode", back_populates="creator")
    permissions = relationship("Permission", back_populates="user", cascade="all, delete-orphan")

    messages_sent = relationship("Message", back_populates="sender")
    portal_uploads = relationship("PortalUpload", back_populates="uploaded_by", cascade="all, delete-orphan")

    gist_center_id = Column(Integer, ForeignKey("gist_centers.id"), nullable=True)
    gist_center = relationship("GistCenter", back_populates="members", foreign_keys=[gist_center_id])
    gist_center_led = relationship(
        "GistCenter",
        back_populates="leader",
        uselist=False,
        foreign_keys="GistCenter.leader_id"
    )
    gist_attendance = relationship("GistAttendance", back_populates="user")

    finances_created = relationship("Finance", back_populates="created_by", cascade="all, delete-orphan")
