 
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Literal, List, Dict
from app.models.attendance import Attendance
from app.models.user import User

def summarize_attendance(db: Session, q, scope: Literal["daily","monthly","yearly"], start: date, end: date):
    # group by date parts
    if scope == "daily":
        key = func.date(Attendance.date)
    elif scope == "monthly":
        key = func.date_trunc("month", Attendance.date)
    else:
        key = func.date_trunc("year", Attendance.date)

    rows = (q.with_entities(key.label("period"),
                            Attendance.status,
                            func.count().label("count"))
              .filter(Attendance.date.between(start, end))
              .group_by("period", Attendance.status)
              .order_by("period")
              .all())
    # reshape to dict
    out: Dict[str, Dict[str, int]] = {}
    for r in rows:
        p = str(r.period)
        out.setdefault(p, {"PRESENT":0,"ABSENT":0,"LATE":0})
        out[p][r.status] = r.count
    return out
