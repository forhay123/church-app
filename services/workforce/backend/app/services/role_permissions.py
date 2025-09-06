# app/services/role_permissions.py
from sqlalchemy.orm import Session
from app.models.role_permission import RolePermission
from app.models.role import Role

def can_role_send_to(db: Session, sender_role: Role, target_role: Role) -> bool:
    """
    Check if sender_role can send to target_role.
    """
    perm = db.query(RolePermission).filter_by(
        role_id=sender_role.id,
        target_role_id=target_role.id
    ).first()
    return perm.can_send if perm else False
