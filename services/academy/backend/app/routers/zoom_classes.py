# C:\Users\User\Desktop\church-app\services\academy\backend\app\routers\zoom_classes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List
from .. import schemas, models
from ..database import get_db
from ..dependencies import get_current_user   # ✅ use dependencies, not auth

router = APIRouter(prefix="/zoom-classes", tags=["Zoom Classes"])

# -------------------------------
# ✅ Create Zoom Meeting
# -------------------------------
@router.post("/meetings/", response_model=schemas.ZoomMeetingOut, status_code=status.HTTP_201_CREATED)
def create_zoom_meeting(
    meeting: schemas.ZoomMeetingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and teachers can create Zoom meetings."
        )

    host_id = current_user.id

    # Prevent duplicates for the same timetable slot
    if meeting.timetable_id:
        existing_meeting = db.query(models.ZoomMeeting).filter(
            models.ZoomMeeting.timetable_id == meeting.timetable_id
        ).first()
        if existing_meeting:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A Zoom meeting already exists for timetable ID {meeting.timetable_id}."
            )

    db_meeting = models.ZoomMeeting(
        meeting_url=meeting.meeting_url,
        topic=meeting.topic,
        start_time=meeting.start_time,
        duration_minutes=meeting.duration_minutes,
        host_id=host_id,
        timetable_id=meeting.timetable_id
    )

    db.add(db_meeting)
    db.commit()

    # ✅ Reload with joinedload so relationships are included
    db_meeting = (
        db.query(models.ZoomMeeting)
        .options(
            joinedload(models.ZoomMeeting.host),
            joinedload(models.ZoomMeeting.timetable_slot).joinedload(models.Timetable.subject_rel)
        )
        .filter(models.ZoomMeeting.id == db_meeting.id)
        .first()
    )

    return db_meeting


# -------------------------------
# ✅ Get All Zoom Meetings
# -------------------------------
@router.get("/meetings/", response_model=List[schemas.ZoomMeetingOut])
def get_all_zoom_meetings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Students:
      - JSS1–JSS3 → see all subjects for their level (department ignored).
      - SS1–SS3 → see subjects for their level AND (department = student's department OR general).
    Teachers/Admins: See all meetings.
    """
    base_query = db.query(models.ZoomMeeting).options(
        joinedload(models.ZoomMeeting.host),
        joinedload(models.ZoomMeeting.timetable_slot).joinedload(models.Timetable.subject_rel)
    )

    if current_user.role == "student":
        query = base_query.join(models.Timetable)

        # Junior secondary (department not considered)
        if current_user.level and current_user.level.lower().startswith("jss"):
            return query.filter(
                models.Timetable.level == current_user.level
            ).all()

        # Senior secondary (department considered, plus general)
        elif current_user.level and current_user.level.lower().startswith("ss"):
            return query.filter(
                models.Timetable.level == current_user.level,
                or_(
                    models.Timetable.department == current_user.department,
                    models.Timetable.department.is_(None),
                    models.Timetable.department == ""
                )
            ).all()

        # Unknown level → return nothing
        return []

    # Teachers & admins → unrestricted
    return base_query.all()


# -------------------------------
# ✅ Get Single Meeting
# -------------------------------
@router.get("/meetings/{meeting_id}", response_model=schemas.ZoomMeetingOut)
def get_zoom_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    meeting = (
        db.query(models.ZoomMeeting)
        .options(
            joinedload(models.ZoomMeeting.host),
            joinedload(models.ZoomMeeting.timetable_slot).joinedload(models.Timetable.subject_rel)
        )
        .filter(models.ZoomMeeting.id == meeting_id)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zoom meeting not found."
        )
    return meeting


# -------------------------------
# ✅ Delete Meeting
# -------------------------------
@router.delete("/meetings/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zoom_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    meeting = db.query(models.ZoomMeeting).filter(models.ZoomMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zoom meeting not found."
        )

    if meeting.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this meeting."
        )

    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully."}


# -------------------------------
# ✅ Get Teacher Timetable Options (Multi-Subject)
# -------------------------------
@router.get("/timetable-options/teacher")
def get_teacher_timetable_options(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns the logged-in teacher’s timetable slots.
    Filters by all subjects assigned in teacher_subjects.
    """
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can view timetable options."
        )

    teacher_subjects = (
        db.query(models.TeacherSubject.subject_id)
        .filter(models.TeacherSubject.teacher_id == current_user.id)
        .all()
    )
    subject_ids = [ts.subject_id for ts in teacher_subjects]

    if not subject_ids:
        return []

    slots = (
        db.query(models.Timetable)
        .options(joinedload(models.Timetable.subject_rel))
        .filter(models.Timetable.subject_id.in_(subject_ids))
        .all()
    )

    return [
        {
            "id": slot.id,
            "day": slot.day,
            "period": slot.period,
            "start_time": str(slot.start_time),
            "end_time": str(slot.end_time),
            "subject": slot.subject_rel.name if slot.subject_rel else None,
            "level": slot.level,
            "department": slot.department,
        }
        for slot in slots
    ]
