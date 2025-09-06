from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Import models
from app.models.user import User, Role
from app.models.church import Church
from app.models.department import Department
from app.models.attendance import Attendance
from app.models.attendance_qr import AttendanceQRCode
from app.models.org import Group, ExecutiveAssignment

# Import routers
from app.api.routes import (
    auth, attendance, users, org, lookup, attendance_qr, permissions,
    role_permissions, messages, access, portal_uploads, gist, finance
)
from app.api.routes.attendance import member_router as member_attendance_router

# FastAPI app
app = FastAPI(title=settings.PROJECT_NAME)

# -------------------- CORS --------------------
# The CORS origins should be broad enough to handle your local and public URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        os.environ.get("BACKEND_URL", "https://020f77fa8425.ngrok-free.app"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Auto-create tables --------------------
Base.metadata.create_all(bind=engine)

# -------------------- API routes --------------------
# The API routers are prefixed with "/api" which aligns with your NGINX rewrite rule.
app.include_router(auth.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(org.router, prefix="/api")
app.include_router(lookup.router, prefix="/api")
app.include_router(attendance_qr.router, prefix="/api")
app.include_router(member_attendance_router, prefix="/api")
app.include_router(permissions.router, prefix="/api")
app.include_router(role_permissions.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(access.router, prefix="/api")
app.include_router(portal_uploads.router, prefix="/api")
app.include_router(gist.router, prefix="/api")
app.include_router(finance.router, prefix="/api")

# -------------------- Uploads --------------------
# This variable is no longer needed since NGINX will handle the prefix.
# MOUNT_PREFIX = os.environ.get("BACKEND_MOUNT_PREFIX", "/workforce").rstrip("/")

# This points to the correct local folder
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Correct the mounting path to match the generated URLs
# Mount the parent "uploads" directory at the root of the backend server.
# NGINX will handle proxying the /workforce/uploads/ path.
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
