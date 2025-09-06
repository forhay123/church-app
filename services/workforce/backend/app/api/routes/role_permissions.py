# app/api/routes/role_permissions.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.org import RolePermission
from app.schemas.role_permission import RolePermission as RolePermissionSchema, RolePermissionCreate
from app.core.roles import Role
from app.api.deps import get_current_admin_user, get_current_user
from app.db.session import get_db

router = APIRouter(prefix="/role-permissions", tags=["Role Permissions"])

# ---------------------- Grant Role-to-Role Permission (Admin Only) ----------------------
@router.post("/", response_model=RolePermissionSchema, dependencies=[Depends(get_current_admin_user)])
def grant_role_permission(payload: RolePermissionCreate, db: Session = Depends(get_db)):
    try:
        # Use the Role enum directly
        sender_role = Role(payload.sender_role)
        target_role = Role(payload.target_role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role value")

    perm = db.query(RolePermission).filter_by(
        sender_role=sender_role,
        target_role=target_role
    ).first()

    if perm:
        raise HTTPException(status_code=400, detail="Permission already exists")

    perm = RolePermission(sender_role=sender_role, target_role=target_role)
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


# ---------------------- List Targets for a Given Sender ----------------------
@router.get("/{sender_role}", response_model=List[RolePermissionSchema])
def list_role_permissions(sender_role: str, db: Session = Depends(get_db)):
    # This endpoint is accessible to any authenticated user, hence no dependency
    try:
        sender_role_enum = Role(sender_role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid sender role.")

    return db.query(RolePermission).filter_by(sender_role=sender_role_enum).all()


# ---------------------- Revoke Role-to-Role Permission (Admin Only) ----------------------
@router.delete("/{sender_role}/{target_role}", dependencies=[Depends(get_current_admin_user)])
def revoke_role_permission(sender_role: Role, target_role: Role, db: Session = Depends(get_db)):
    perm = db.query(RolePermission).filter_by(
        sender_role=sender_role,
        target_role=target_role
    ).first()

    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    db.delete(perm)
    db.commit()
    return {"message": f"Permission revoked: {sender_role} -> {target_role}"}