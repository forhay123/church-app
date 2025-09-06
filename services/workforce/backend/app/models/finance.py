from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, DateTime, Numeric, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.db.base import Base


class Finance(Base):
    __tablename__ = "finances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    venue: Mapped[str | None] = mapped_column(String(255), nullable=True)
    host: Mapped[str | None] = mapped_column(String(120), nullable=True)
    hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    offerings: Mapped[float | None] = mapped_column(Numeric(12, 2), default=0.0)
    partnership_offering: Mapped[float | None] = mapped_column(Numeric(12, 2), default=0.0)

    extra_details: Mapped[dict] = mapped_column(JSONB, default=dict)

    church_id: Mapped[int] = mapped_column(ForeignKey("churches.id"), nullable=False)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    # ✅ Automatic timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    church = relationship("Church", back_populates="finances")
    created_by = relationship("User", back_populates="finances_created")
