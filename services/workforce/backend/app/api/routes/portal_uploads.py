from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import json
import re
import shutil

from app.db.session import get_db
from app.api import deps
from app.models.user import User
from app.models.portal_upload import PortalUpload, UploadType
from app.schemas.portal_upload import PortalUploadOut
from app.models.department import Department
from app.models.user import Role

router = APIRouter(prefix="/portal", tags=["Portal Uploads"])

UPLOAD_BASE_DIR = "app/uploads"
PORTALS_DIR = os.path.join(UPLOAD_BASE_DIR, "portals")
os.makedirs(PORTALS_DIR, exist_ok=True)


def sanitize_filename(filename: str) -> str:
    filename = filename.strip().replace(" ", "_")
    filename = re.sub(r"[^\w\-.]", "_", filename)
    return filename


def save_upload_file(upload_file: UploadFile, upload_path: str) -> str:
    os.makedirs(upload_path, exist_ok=True)
    safe_name = sanitize_filename(upload_file.filename)
    filename = f"{int(datetime.utcnow().timestamp())}_{safe_name}"
    file_path = os.path.join(upload_path, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()

    # Return URL relative to FastAPI /uploads mount
    return f"/uploads/portals/{filename}"


@router.post("/upload", response_model=PortalUploadOut)
async def upload_portal_item(
    description: Optional[str] = Form(None),
    department_id: Optional[int] = Form(None),
    church_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    link: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if not file and not link:
        raise HTTPException(status_code=400, detail="You must upload a file or provide a link")

    filename = None
    file_url = None
    upload_type = None

    if file:
        file_url = save_upload_file(file, PORTALS_DIR)
        filename = file_url.split("/")[-1]
        upload_type = UploadType.IMAGE if any(file.filename.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]) else UploadType.VIDEO

    if link:
        file_url = link
        filename = sanitize_filename(link.split("/")[-1])
        upload_type = UploadType.LINK

    new_item = PortalUpload(
        filename=filename,
        file_url=file_url,
        description=description,
        uploaded_by_id=current_user.id,
        department_id=department_id,
        church_id=church_id,
        type=upload_type
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.get("/list", response_model=List[PortalUploadOut])
def list_portal_uploads(
    church_id: Optional[int] = None,
    department_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    query = db.query(PortalUpload)

    if church_id:
        query = query.filter(PortalUpload.church_id == church_id)
    if department_name:
        department = db.query(Department).filter(Department.name == department_name).first()
        if department:
            query = query.filter(PortalUpload.department_id == department.id)
        else:
            return []

    return query.order_by(PortalUpload.uploaded_at.desc()).all()


@router.delete("/{upload_id}")
def delete_portal_upload(
    upload_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    upload = db.query(PortalUpload).filter(PortalUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    if upload.uploaded_by_id != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this upload")

    # Delete file from disk if it exists and is not a link
    if upload.file_url and not upload.file_url.startswith("http"):
        local_path = os.path.join("app", upload.file_url.lstrip("/"))
        if os.path.exists(local_path):
            os.remove(local_path)

    db.delete(upload)
    db.commit()
    return {"detail": "Upload deleted successfully"}


@router.delete("/{upload_id}")
def delete_portal_upload(
    upload_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    upload = db.query(PortalUpload).filter(PortalUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    # ✅ Only admins can delete
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete uploads")

    # Delete file from disk if it exists and is not a link
    if upload.file_url and not upload.file_url.startswith("http"):
        local_path = os.path.join("app", upload.file_url.lstrip("/"))
        if os.path.exists(local_path):
            os.remove(local_path)

    db.delete(upload)
    db.commit()
    return {"detail": "Upload deleted successfully"}

