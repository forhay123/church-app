from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date
from typing import List, Optional
from sqlalchemy import func, case

from app.api.deps import get_db, get_current_user
from app.schemas.attendance import AttendanceBulkCreate, AttendanceOut
from app.models.attendance import Attendance, AttendanceStatus
from app.models.user import User
from app.core.roles import Role
from app.services.rbac import apply_attendance_scope
from app.services.attendance_service import summarize_attendance

router = APIRouter(prefix="/attendance", tags=["attendance"])

# ---------------- Bulk Attendance ----------------
@router.post("/", response_model=List[AttendanceOut])
def mark_bulk_attendance(
    payload: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # ... (permission check code remains the same) ...

    attendance_records = []

    for record in payload.records:
        member_user = db.query(User).filter(User.id == record.user_id).first()
        if not member_user:
            raise HTTPException(status_code=404, detail=f"User {record.user_id} not found")

        # RBAC: Department Leaders can only mark attendance for their own department.
        if user.role == Role.DEPARTMENT_LEADER and member_user.department_id != user.department_id:
            raise HTTPException(status_code=403, detail=f"Cannot mark attendance for a user outside your department.")
            
        existing = db.query(Attendance).filter(
            Attendance.user_id == record.user_id,
            Attendance.date == payload.date
        ).first()

        # Handle updating an existing record
        if existing:
            # Department leaders can only set on_duty if the existing status is PRESENT
            if record.on_duty is not None and existing.status not in [AttendanceStatus.PRESENT, AttendanceStatus.LATE]:
                raise HTTPException(status_code=403, detail=f"Cannot set 'on duty' for a member who is not present.")

            if record.status is not None:
                # Disallow changing status from an existing record if it's not a change to the same status
                if existing.status != record.status:
                     existing.status = record.status
                # If a leader marks a member PRESENT, they can then mark them on duty in the same request.
                if record.status.upper() == AttendanceStatus.PRESENT and record.on_duty is not None:
                     existing.on_duty = record.on_duty
                
            if record.on_duty is not None:
                # Ensure `on_duty` is only set if the status is `PRESENT`
                if existing.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE]:
                     existing.on_duty = record.on_duty
                else:
                     raise HTTPException(status_code=403, detail="Can only mark 'on duty' for present members.")

            existing.created_by = user.id
            db.add(existing)
            attendance_records.append(existing)

        # Handle creating a new record
        else:
             # A user can't be 'on duty' if they aren't marked as present.
             if record.on_duty and record.status.upper() != AttendanceStatus.PRESENT:
                 raise HTTPException(status_code=400, detail="Cannot mark 'on duty' without also marking 'present'.")

             rec = Attendance(
                 user_id=record.user_id,
                 date=payload.date,
                 status=record.status.upper() if record.status else None,
                 on_duty=record.on_duty,
                 created_by=user.id,
                 church_id=member_user.church_id,
                 department_id=member_user.department_id
             )
             db.add(rec)
             attendance_records.append(rec)

    db.commit()
    for rec in attendance_records:
        db.refresh(rec)
        rec.user_name = rec.user.name if rec.user else None

    return attendance_records


# ---------------- List Attendance ----------------
@router.get("/", response_model=List[AttendanceOut])
def list_attendance(
    date: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    q = db.query(Attendance).options(joinedload(Attendance.user))
    q = apply_attendance_scope(q, user)
    if date:
        q = q.filter(Attendance.date == date)
    records = q.offset(skip).limit(limit).all()

    for r in records:
        r.user_name = r.user.name if r.user else None

    return records


# ---------------- Member-specific route ----------------
member_router = APIRouter(prefix="/member/attendance", tags=["member_attendance"])

@member_router.get("/", response_model=List[AttendanceOut])
def get_my_attendance(
    date: Optional[date] = Query(None, description="Filter by date"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(Attendance).options(joinedload(Attendance.user)).filter(Attendance.user_id == user.id)
    if date:
        query = query.filter(Attendance.date == date)
    records = query.all()

    for r in records:
        r.user_name = r.user.name if r.user else None

    return records


# ---------------- Attendance Summary ----------------
@router.get("/summary")
def attendance_summary(scope: str, start_date: date, end_date: date,
                       db: Session = Depends(get_db), user = Depends(get_current_user)):
    if scope not in ("daily","monthly","yearly"):
        raise HTTPException(status_code=400, detail="Invalid scope")
    q = db.query(Attendance)
    q = apply_attendance_scope(q, user)
    return summarize_attendance(db, q, scope, start_date, end_date)


# ---------------- Department Members Records ----------------
@router.get("/department/members", response_model=List[AttendanceOut])
def get_department_members_attendance(
    date: Optional[date] = Query(None, description="Optional filter by date"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if user.role != Role.DEPARTMENT_LEADER:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Step 1: Fetch all members of the leader's department in the same church
    members = db.query(User).filter(
        User.church_id == user.church_id,
        User.department_id == user.department_id
    ).all()

    if not members:
        return []

    member_ids = [m.id for m in members]

    # Step 2: Fetch attendance records for these members (filtered by date)
    attendance_query = db.query(Attendance).options(joinedload(Attendance.user)).filter(
        Attendance.user_id.in_(member_ids),
        Attendance.church_id == user.church_id,
        Attendance.department_id == user.department_id
    )
    if date:
        attendance_query = attendance_query.filter(Attendance.date == date)

    attendance_records = attendance_query.all()

    # Step 3: Map attendance by user_id (list of records)
    attendance_map = {}
    for rec in attendance_records:
        rec.user_name = rec.user.name if rec.user else None
        attendance_map.setdefault(rec.user_id, []).append(rec)

    # Step 4: Build result list for ALL members
    results: List[AttendanceOut] = []
    for member in members:
        member_records = attendance_map.get(member.id)
        if member_records:
            results.extend(member_records)
        else:
            # placeholder if no attendance exists
            results.append(
                AttendanceOut(
                    id=None,  # FIX: Explicitly set id to None for placeholder records
                    user_id=member.id,
                    user_name=member.name,
                    date=date,
                    status=None,
                    on_duty=False,
                    church_id=member.church_id,
                    department_id=member.department_id
                )
            )

    return results


# ---------------- Church Members Records (Pastor view) ----------------
@router.get("/church/members", response_model=List[AttendanceOut])
def get_church_members_attendance(
    date: Optional[date] = Query(None, description="Optional filter by date"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if user.role != Role.PASTOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Step 1: Get ALL members of the pastor’s church
    members = (
        db.query(User)
        .filter(User.church_id == user.church_id)
        .all()
    )

    # Step 2: Get attendance of all church members
    q = (
        db.query(Attendance)
        .options(joinedload(Attendance.user))
        .filter(Attendance.church_id == user.church_id)
    )
    if date:
        q = q.filter(Attendance.date == date)

    attendance_records = q.all()
    attendance_map = {}
    for rec in attendance_records:
        rec.user_name = rec.user.name if rec.user else None
        attendance_map.setdefault(rec.user_id, []).append(rec)

    # Step 3: Build results for all members
    results: List[AttendanceOut] = []
    for member in members:
        member_records = attendance_map.get(member.id, [])
        if not member_records:
            results.append(
                AttendanceOut(
                    id=None,  # FIX: Explicitly set id to None for placeholder records
                    user_id=member.id,
                    user_name=member.name,
                    date=date,
                    status=None,
                    on_duty=False,
                    church_id=member.church_id,
                    department_id=member.department_id,
                )
            )
        else:
            results.extend(member_records)

    return results

# ---------------- Admin All Department Attendance ----------------
@router.get("/admin/all-departments", response_model=List[AttendanceOut])
def get_all_departments_attendance(
    date: Optional[date] = Query(None, description="Filter by date"),
    department_id: Optional[int] = Query(None, description="Optional filter by department"),
    church_id: Optional[int] = Query(None, description="Optional filter by church"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Allows an admin to view attendance and on-duty status for ALL members,
    with optional filters for a specific church and department.
    """
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")

    # Step 1: Query users based on filters. If no church_id is provided, fetch all users.
    users_query = db.query(User)
    
    # Apply filters if they exist
    if church_id:
        users_query = users_query.filter(User.church_id == church_id)
    if department_id:
        users_query = users_query.filter(User.department_id == department_id)
        
    all_users = users_query.all()
    
    if not all_users:
        return []

    user_ids = [u.id for u in all_users]

    # Step 2: Fetch attendance records for the filtered users
    attendance_records = db.query(Attendance).filter(
        Attendance.user_id.in_(user_ids),
        Attendance.date == date
    ).options(joinedload(Attendance.user)).all()

    # Step 3: Map attendance by user_id for quick lookup
    attendance_map = {rec.user_id: rec for rec in attendance_records}

    # Step 4: Build the final response list
    results = []
    for user_obj in all_users:
        attendance_record = attendance_map.get(user_obj.id)
        
        if attendance_record:
            # For existing records, create the Pydantic model instance
            results.append(
                AttendanceOut(
                    id=attendance_record.id,
                    user_id=attendance_record.user_id,
                    user_name=attendance_record.user.name,
                    date=attendance_record.date,
                    status=attendance_record.status,
                    on_duty=attendance_record.on_duty,
                    church_id=attendance_record.church_id,
                    department_id=attendance_record.department_id,
                )
            )
        else:
            # For users without a record, create a placeholder
            results.append(
                AttendanceOut(
                    id=None,  # FIX: Explicitly set id to None for placeholder records
                    user_id=user_obj.id,
                    user_name=user_obj.name,
                    date=date,
                    status=None,
                    on_duty=False,
                    church_id=user_obj.church_id,
                    department_id=user_obj.department_id,
                )
            )
    
    return results


@router.get("/lead-pastor/members", response_model=List[AttendanceOut])
def get_lead_pastor_attendance(
    date: Optional[date] = Query(None, description="Optional filter by date"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if user.role != Role.LEAD_PASTOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    members = (
        db.query(User)
        .filter(User.church_id == user.church_id)
        .all()
    )

    q = (
        db.query(Attendance)
        .options(joinedload(Attendance.user))
        .filter(Attendance.church_id == user.church_id)
    )
    if date:
        q = q.filter(Attendance.date == date)

    attendance_records = q.all()
    attendance_map = {}
    for rec in attendance_records:
        rec.user_name = rec.user.name if rec.user else None
        attendance_map.setdefault(rec.user_id, []).append(rec)

    results: List[AttendanceOut] = []
    for member in members:
        member_records = attendance_map.get(member.id, [])
        if not member_records:
            results.append(
                AttendanceOut(
                    id=None,
                    user_id=member.id,
                    user_name=member.name,
                    date=date,
                    status=None,
                    on_duty=False,
                    church_id=member.church_id,
                    department_id=member.department_id,
                )
            )
        else:
            results.extend(member_records)

    return results



# ---------------- Lead Pastor All Department Attendance ----------------
@router.get("/lead-pastor/all-departments", response_model=List[AttendanceOut])
def get_all_departments_attendance_lead_pastor(
    date: Optional[date] = Query(None, description="Filter by date"),
    department_id: Optional[int] = Query(None, description="Optional filter by department"),
    church_id: Optional[int] = Query(None, description="Optional filter by church"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Allows a Lead Pastor to view attendance and on-duty status for ALL members,
    with optional filters for a specific church and department.
    """
    if user.role != Role.LEAD_PASTOR:
        raise HTTPException(status_code=403, detail="Not authorized. Lead Pastor access required.")

    # Step 1: Query users based on filters. 
    users_query = db.query(User)

    # If Lead Pastor belongs to a church, restrict by default to that church
    if not church_id:
        users_query = users_query.filter(User.church_id == user.church_id)
    else:
        users_query = users_query.filter(User.church_id == church_id)

    # Apply department filter if provided
    if department_id:
        users_query = users_query.filter(User.department_id == department_id)

    all_users = users_query.all()

    if not all_users:
        return []

    user_ids = [u.id for u in all_users]

    # Step 2: Fetch attendance records for the filtered users
    attendance_records = db.query(Attendance).filter(
        Attendance.user_id.in_(user_ids),
        Attendance.date == date
    ).options(joinedload(Attendance.user)).all()

    # Step 3: Map attendance by user_id
    attendance_map = {rec.user_id: rec for rec in attendance_records}

    # Step 4: Build final response
    results = []
    for user_obj in all_users:
        attendance_record = attendance_map.get(user_obj.id)

        if attendance_record:
            results.append(
                AttendanceOut(
                    id=attendance_record.id,
                    user_id=attendance_record.user_id,
                    user_name=attendance_record.user.name,
                    date=attendance_record.date,
                    status=attendance_record.status,
                    on_duty=attendance_record.on_duty,
                    church_id=attendance_record.church_id,
                    department_id=attendance_record.department_id,
                )
            )
        else:
            results.append(
                AttendanceOut(
                    id=None,
                    user_id=user_obj.id,
                    user_name=user_obj.name,
                    date=date,
                    status=None,
                    on_duty=False,
                    church_id=user_obj.church_id,
                    department_id=user_obj.department_id,
                )
            )

    return results
