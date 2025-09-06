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
# Explicitly allow Render Gateway + local dev
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://gateway.onrender.com",        # Gateway (public entry point)
    "https://workforce-frontend.onrender.com",  # Direct frontend (Render)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Auto-create tables --------------------
Base.metadata.create_all(bind=engine)

# -------------------- API routes --------------------
# All routes prefixed with /api → NGINX/Gateway rewrites /workforce/api → backend/api
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
# Local upload storage
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount at /uploads → Gateway proxies /workforce/uploads → backend/uploads
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
