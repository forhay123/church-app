from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import shutil, os
from typing import List, Optional
from datetime import date

from app.db.session import get_db
from app.models.gist import GistCenter, GistAttendance, GistFile
from app.models.user import User
from app.schemas import gist as schemas
from app.schemas.user import UserOut
from app.api.deps import get_current_user  # ✅ import dependency correctly

router = APIRouter(prefix="/gist", tags=["Gist Center"])

# --------- Create Gist Center ---------
@router.post("/centers", response_model=schemas.GistCenterOut)
def create_gist_center(center: schemas.GistCenterCreate, db: Session = Depends(get_db)):
    new_center = GistCenter(**center.model_dump())
    db.add(new_center)
    db.commit()
    db.refresh(new_center)
    return new_center


# --------- Take Attendance ---------
@router.post("/attendance", response_model=schemas.GistAttendanceOut)
def take_attendance(
    att: schemas.GistAttendanceCreate,
    attended_on: Optional[date] = Query(None, description="Optional date of attendance"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "GIST_HEAD":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Forbidden: Only Gist leaders can take attendance.")

    gist_center = db.query(GistCenter).filter(GistCenter.leader_id == current_user.id).first()
    if not gist_center:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Gist Center not found for this leader.")

    if att.gist_center_id != gist_center.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only mark attendance for your own Gist Center.")

    member_to_mark = db.query(User).filter(User.id == att.user_id,
                                           User.gist_center_id == gist_center.id).first()
    if not member_to_mark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Member not found in your Gist Center.")

    attendance_date = attended_on or date.today()

    existing_att = db.query(GistAttendance).filter(
        GistAttendance.user_id == att.user_id,
        GistAttendance.gist_center_id == att.gist_center_id,
        func.date(GistAttendance.attended_on) == attendance_date
    ).first()

    if existing_att:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Attendance already marked for this member on {attendance_date}.")

    new_att = GistAttendance(**att.model_dump(), attended_on=attendance_date)
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return new_att


# --------- Remove Attendance (with optional date) ---------
@router.delete("/attendance", response_model=dict)
def remove_attendance(
    gist_center_id: int = Query(..., description="ID of the Gist Center"),
    user_id: int = Query(..., description="ID of the user to unmark"),
    attended_on: Optional[date] = Query(None, description="Optional date of attendance to remove"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "GIST_HEAD":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Forbidden: Only Gist leaders can remove attendance.")

    gist_center = db.query(GistCenter).filter(GistCenter.id == gist_center_id).first()
    if not gist_center or gist_center.leader_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only remove attendance for your own Gist Center.")

    attendance_date = attended_on or date.today()

    attendance_record = db.query(GistAttendance).filter(
        GistAttendance.user_id == user_id,
        GistAttendance.gist_center_id == gist_center_id,
        func.date(GistAttendance.attended_on) == attendance_date
    ).first()

    if not attendance_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Attendance record not found for this member on {attendance_date}.")

    db.delete(attendance_record)
    db.commit()
    return {"message": f"Attendance removed successfully for {attendance_date}."}


# --------- Upload Files by Leader ---------
UPLOAD_DIR = "uploads/gist_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/files/upload", response_model=schemas.GistFileOut)
def upload_file(
    gist_center_id: int,
    leader_id: int,
    file_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    gist_center = db.query(GistCenter).filter_by(id=gist_center_id).first()
    if not gist_center:
        raise HTTPException(status_code=404, detail="Gist center not found")

    safe_filename = file.filename.replace(" ", "_")
    filename = f"{gist_center_id}_{leader_id}_{safe_filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/gist_files/{filename}"
    gist_file = GistFile(
        gist_center_id=gist_center_id,
        leader_id=leader_id,
        file_type=file_type,
        file_url=file_url,
    )
    db.add(gist_file)
    db.commit()
    db.refresh(gist_file)
    return gist_file


# --------- List Files for Members ---------
@router.get("/files/{gist_center_id}", response_model=List[schemas.GistFileOut])
def list_files(gist_center_id: int, db: Session = Depends(get_db)):
    return db.query(GistFile).filter(GistFile.gist_center_id == gist_center_id).all()


# --------- List Gist Centers ---------
@router.get("/centers", response_model=List[schemas.GistCenterOut])
def list_gist_centers(db: Session = Depends(get_db)):
    return db.query(GistCenter).all()


# --------- Assign Member to Gist Center ---------
@router.post("/centers/{center_id}/assign/{user_id}")
def assign_member_to_center(center_id: int, user_id: int, db: Session = Depends(get_db)):
    gist_center = db.query(GistCenter).filter_by(id=center_id).first()
    if not gist_center:
        raise HTTPException(status_code=404, detail="Gist center not found")

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.gist_center_id = center_id
    db.commit()
    return {"message": f"User {user.email} assigned to {gist_center.name}"}


# --------- List Members in a Gist Center ---------
@router.get("/centers/{center_id}/members")
def list_center_members(center_id: int, db: Session = Depends(get_db)):
    gist_center = db.query(GistCenter).filter_by(id=center_id).first()
    if not gist_center:
        raise HTTPException(status_code=404, detail="Gist center not found")

    return db.query(User).filter(User.gist_center_id == center_id).all()


# --------- Fetch Users with Filters ---------
@router.get("/users", response_model=List[UserOut])
def get_users(
    only_unassigned: bool = Query(False, description="Return only users not assigned to any Gist center"),
    name: Optional[str] = Query(None, description="Filter by user name"),
    gist_center_id: Optional[int] = Query(None, description="Filter by gist center"),
    church_id: Optional[int] = Query(None, description="Filter by church"),
    db: Session = Depends(get_db),
):
    query = db.query(User)

    if only_unassigned:
        query = query.filter(User.gist_center_id.is_(None))

    if name:
        query = query.filter(User.name.ilike(f"%{name}%"))

    if gist_center_id:
        query = query.filter(User.gist_center_id == gist_center_id)

    if church_id:
        query = query.filter(User.church_id == church_id)

    return query.all()


# --------- Get Gist Center by Leader ---------
@router.get("/center/by-leader", response_model=schemas.GistCenterOut)
def get_gist_center_by_leader(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "GIST_HEAD":
        raise HTTPException(status_code=403, detail="Access forbidden: not a GIST_HEAD")

    gist_center = db.query(GistCenter).filter(GistCenter.leader_id == current_user.id).first()
    if not gist_center:
        raise HTTPException(
            status_code=404,
            detail="No Gist Center found for this leader"
        )

    return gist_center

@router.get("/centers/{center_id}", response_model=schemas.GistCenterOut)
def get_gist_center(center_id: int, db: Session = Depends(get_db)):
    gist_center = db.query(GistCenter).filter(GistCenter.id == center_id).first()
    if not gist_center:
        raise HTTPException(status_code=404, detail="Gist Center not found")
    return gist_center



# ✅ NEW: Get attendance records for the current user
@router.get("/attendance/my", response_model=List[schemas.GistAttendanceOut])
def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attendance_records = db.query(GistAttendance).filter(GistAttendance.user_id == current_user.id).all()
    return attendance_records

from fastapi import status

@router.get("/attendance/history/{gist_center_id}", response_model=List[schemas.GistAttendanceOut])
def get_gist_attendance_history(
    gist_center_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches all attendance records for a specific Gist Center.
    Requires GIST_HEAD role and the leader must own the center.
    """
    # Security check: Ensure the user is a GIST_HEAD
    if current_user.role.upper() != "GIST_HEAD":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Gist leaders can view attendance history."
        )

    # Fetch the Gist Center
    gist_center = db.query(GistCenter).filter(GistCenter.id == gist_center_id).first()
    if not gist_center:
        raise HTTPException(status_code=404, detail="Gist Center not found.")

    # Security check: Ensure the leader owns this Gist Center
    if gist_center.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only view the attendance history for your own Gist Center."
        )

    attendance_records = db.query(GistAttendance).filter(
        GistAttendance.gist_center_id == gist_center_id
    ).order_by(GistAttendance.attended_on.desc()).all()

    return attendance_records

