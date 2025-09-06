# app/db/base.py
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so Alembic can discover them
from app.models import (
    user,
    attendance,
    attendance_qr,
    church,
    department,
    org,
    access_code,
    portal_upload,
    gist,  # ✅ add this
)
