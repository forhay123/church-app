# app/models/permission.py
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, String, Boolean
from app.db.base import Base


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)  # e.g. "Pastor", "Executive"
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    can_access: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="permissions")

    def __repr__(self) -> str:
        return f"<Permission id={self.id} user_id={self.user_id} role={self.role} resource='{self.resource}' access={self.can_access}>"
