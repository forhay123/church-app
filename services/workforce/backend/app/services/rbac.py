from typing import Optional
from sqlalchemy.orm import Query, Session
from app.core.roles import Role
from app.models.attendance import Attendance
from app.models.user import User

def apply_attendance_scope(q: Query, current_user: User) -> Query:
    # Admin + Lead Pastor: see all
    if current_user.role in [Role.ADMIN, Role.LEAD_PASTOR]:
        return q

    # Executive: attendance within assigned groups (expand later)
    if current_user.role == Role.EXECUTIVE:
        exec_church_ids = []  # fetch from DB
        return q.filter(Attendance.church_id.in_(exec_church_ids))

    # Pastor: attendance for their church
    if current_user.role == Role.PASTOR:
        return q.filter(Attendance.church_id == current_user.church_id)

    # Department Leader: attendance for their department
    if current_user.role == Role.DEPARTMENT_LEADER:
        return q.filter(Attendance.department_id == current_user.department_id)

    # Member: only their own attendance
    if current_user.role == Role.MEMBER:
        return q.filter(Attendance.user_id == current_user.id)

    # Everyone else → only if Admin grants permission
    # Example: Academy Head, Teens Head, etc.
    if any(role == current_user.role for role in [
        Role.ASSOCIATE_PASTOR, Role.ACADEMY_HEAD, Role.GIST_HEAD,
        Role.TEENS_HEAD, Role.GLOBAL_LEADS, Role.HEAD_A, Role.HEAD_B,
        Role.HEAD_C, Role.HEAD_D
    ]):
        if has_access(current_user, "attendance_portal"):
            return q
        else:
            return q.filter(False)

    # Default deny
    return q.filter(False)


def has_access(user: User, resource: str) -> bool:
    # Admin + Lead Pastor = full access
    if user.role in [Role.ADMIN, Role.LEAD_PASTOR]:
        return True

    # Check permissions list
    perm = next((p for p in user.permissions if p.resource == resource), None)
    return perm.can_access if perm else False
