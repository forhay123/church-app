import os
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets
from datetime import date
from app.models.attendance_qr import AttendanceQRCode
from app.models.attendance import Attendance
from app.models.user import User
from app.api.deps import get_db, get_current_user
from app.core.roles import Role
from app.core.config import settings # Assuming this is where settings is imported

router = APIRouter(prefix="/attendance-qr", tags=["attendance_qr"])

# Admin generates a QR token, not a full link
@router.post("/generate")
def generate_qr(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in {Role.ADMIN, Role.PASTOR, Role.DEPARTMENT_LEADER}:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 🔍 Debug log for environment check
    print("🔗 FRONTEND_URL from settings:", settings.FRONTEND_URL)

    token = secrets.token_urlsafe(8)
    qr = AttendanceQRCode(
        token=token,
        date=date.today(),
        created_by=user.id
    )
    db.add(qr)
    db.commit()
    db.refresh(qr)

    # Build full frontend link instead of just returning token
    link = f"{settings.FRONTEND_URL}/attendance-qr/{qr.token}"

    return {
        "token": qr.token,
        "link": link
    }

# User marks attendance via QR/link
@router.post("/{token}")
def mark_attendance(token: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    qr = db.query(AttendanceQRCode).filter_by(token=token, is_active=True).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Invalid or expired QR code/link")

    # Prevent duplicate attendance
    existing = db.query(Attendance).filter_by(user_id=user.id, date=qr.date).first()
    if existing:
        return {"detail": "Attendance already marked"}

    attendance = Attendance(
        user_id=user.id,
        date=qr.date,
        status="PRESENT",
        created_by=user.id,
        church_id=user.church_id,
        department_id=user.department_id
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return {"detail": "Attendance marked successfully"}

