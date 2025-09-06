# routes/permissions.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.user import User
from app.models.permission import Permission
from app.schemas.permission import Permission as PermissionSchema
from app.api.deps import get_current_admin_user
from app.db.session import get_db

router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"],
    dependencies=[Depends(get_current_admin_user)]  # only admins can manage permissions
)

# ---------------------- Grant Access ----------------------
@router.post("/grant/{user_id}")
def grant_access(user_id: int, resource: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    perm = next((p for p in user.permissions if p.resource == resource), None)
    if not perm:
        perm = Permission(user_id=user.id, resource=resource, can_access=True)
        db.add(perm)
    else:
        perm.can_access = True

    db.commit()
    return {"message": f"Access granted to {user.name} for {resource}"}


# ---------------------- Revoke Access ----------------------
@router.post("/revoke/{user_id}")
def revoke_access(user_id: int, resource: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    perm = next((p for p in user.permissions if p.resource == resource), None)
    if not perm:
        raise HTTPException(404, "Permission not found")

    perm.can_access = False
    db.commit()
    return {"message": f"Access revoked for {user.name} on {resource}"}


# ---------------------- List User Permissions ----------------------
@router.get("/user/{user_id}", response_model=List[PermissionSchema])
def list_user_permissions(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user.permissions


# ---------------------- Bulk Assign Permissions ----------------------
@router.post("/bulk-assign/{user_id}")
def bulk_assign_permissions(user_id: int, resources: List[str], db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    for resource in resources:
        perm = next((p for p in user.permissions if p.resource == resource), None)
        if not perm:
            db.add(Permission(user_id=user.id, resource=resource, can_access=True))
        else:
            perm.can_access = True

    db.commit()
    return {"message": f"Permissions granted to {user.name} for {resources}"}


# ---------------------- Grant Role Access ----------------------
@router.post("/grant-role/{role}")
def grant_role_access(role: str, resource: str, db: Session = Depends(get_db)):
    perm = db.query(Permission).filter_by(role=role, resource=resource).first()
    if not perm:
        perm = Permission(role=role, resource=resource, can_access=True)
        db.add(perm)
    else:
        perm.can_access = True
    db.commit()
    return {"message": f"Access granted to role '{role}' for {resource}"}


# ---------------------- Revoke Role Access ----------------------
@router.post("/revoke-role/{role}")
def revoke_role_access(role: str, resource: str, db: Session = Depends(get_db)):
    perm = db.query(Permission).filter_by(role=role, resource=resource).first()
    if not perm:
        raise HTTPException(404, "Permission not found")

    perm.can_access = False
    db.commit()
    return {"message": f"Access revoked for role '{role}' on {resource}"}


# ---------------------- List Role Permissions ----------------------
@router.get("/role/{role}", response_model=List[PermissionSchema])
def list_role_permissions(role: str, db: Session = Depends(get_db)):
    return db.query(Permission).filter_by(role=role).all()