# app/models/org.py

from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import String, Integer, Enum, UniqueConstraint, ForeignKey
from app.db.base import Base
from app.core.roles import Role


class Group(Base):
    __tablename__ = "groups"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))


class ExecutiveAssignment(Base):
    __tablename__ = "executive_assignments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    executive_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)


class RolePermission(Base):
    """
    Defines which role can send information to which other role(s).
    Example: Associate Pastor -> can send to Pastor, Choir, Youth Leader
    """
    __tablename__ = "role_permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    sender_role: Mapped[Role] = mapped_column(Enum(Role), index=True)   # e.g. ASSOCIATE_PASTOR
    target_role: Mapped[Role] = mapped_column(Enum(Role), index=True)   # e.g. PASTOR

    __table_args__ = (
        UniqueConstraint("sender_role", "target_role", name="uq_role_permission"),
    )

    def __repr__(self) -> str:
        return f"<RolePermission sender={self.sender_role} target={self.target_role}>"
