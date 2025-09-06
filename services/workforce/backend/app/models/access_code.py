# backend/app/models/access_code.py

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime
from datetime import datetime, timedelta
from app.db.base import Base
from app.core.config import settings

class AccessCode(Base):
    __tablename__ = "access_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    page_route: Mapped[str] = mapped_column(String(255), nullable=False)
    is_used: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.utcnow() + timedelta(minutes=settings.ACCESS_CODE_EXPIRE_MINUTES)
    )

    def is_valid(self) -> bool:
        """Check if the code is still valid and not used."""
        return not self.is_used and datetime.utcnow() < self.expires_at