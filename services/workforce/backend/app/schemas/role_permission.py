# app/schemas/role_permission.py

from pydantic import BaseModel
from app.core.roles import Role


class RolePermissionBase(BaseModel):
    sender_role: Role
    target_role: Role


class RolePermissionCreate(RolePermissionBase):
    pass


class RolePermission(RolePermissionBase):
    id: int

    class Config:
        from_attributes = True
