# app/api/deps.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, Query

from app.db.session import SessionLocal
from app.core.roles import Role
from app.models.attendance import Attendance
from app.models.user import User
from app.core.security import decode_access_token  # make sure you have this implemented

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# ---------------- Get DB ----------------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- Get current user ----------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# ---------------- Admin-only check ----------------
def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user is an Admin."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only",
        )
    return current_user

# ---------------- Attendance scoping ----------------
def apply_attendance_scope(q: Query, current_user: User) -> Query:
    if current_user.role == Role.ADMIN:
        return q

    if current_user.role == Role.EXECUTIVE:
        exec_church_ids = []  # TODO: fetch from DB
        return q.filter(Attendance.church_id.in_(exec_church_ids))

    if current_user.role == Role.PASTOR:
        return q.filter(Attendance.church_id == current_user.church_id)

    if current_user.role == Role.DEPARTMENT_LEADER:
        return q.filter(Attendance.department_id == current_user.department_id)

    if current_user.role == Role.MEMBER:
        return q.filter(Attendance.user_id == current_user.id)

    return q.filter(False)
