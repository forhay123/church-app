# app/models/role_permission.py
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, Boolean
from app.db.base import Base


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True)  # sender
    target_role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True)  # receiver
    can_send: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    role = relationship("Role", foreign_keys=[role_id], back_populates="sent_permissions")
    target_role = relationship("Role", foreign_keys=[target_role_id], back_populates="received_permissions")
