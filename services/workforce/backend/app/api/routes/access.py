# backend/app/api/routes/access.py

import secrets
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.access_code import AccessCode
from app.schemas.access_code import AccessCode as AccessCodeSchema, AccessCodeRequest, AccessCodeVerification, AccessCodeResponse
from app.core.config import settings
from app.core.security import create_access_token, get_current_active_admin
from app.models.user import User

router = APIRouter(prefix="/access", tags=["access"])

# Helper function to generate a random code
def generate_code() -> str:
    """Generates a random 8-character alphanumeric code."""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(8))


@router.post("/request", response_model=AccessCodeResponse)
def request_access_code(
    request: AccessCodeRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint for users to request a code for a restricted page.
    Generates a unique code and saves it to the database.
    This should notify an admin who will manually provide the code.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found."
        )

    db.query(AccessCode).filter(
        AccessCode.email == request.email,
        AccessCode.page_route == request.page_route,
        AccessCode.is_used == False
    ).delete()
    db.commit()

    code = generate_code()
    new_code = AccessCode(
        email=request.email,
        code=code,
        page_route=request.page_route
    )
    db.add(new_code)
    db.commit()

    # ✅ CORRECTED LOGIC: Do NOT return the code.
    # Instead, you would trigger a notification here to an admin.
    return {"message": "Access code requested. Please check your email for a code from an admin."}


@router.post("/verify", response_model=AccessCodeResponse)
def verify_access_code(
    verification: AccessCodeVerification,
    db: Session = Depends(get_db)
):
    """
    Verifies the access code and returns a temporary access token.
    """
    access_code = db.query(AccessCode).filter(
        AccessCode.email == verification.email,
        AccessCode.code == verification.code,
        AccessCode.page_route == verification.page_route
    ).first()

    if not access_code or not access_code.is_valid():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access code."
        )

    # Mark the code as used
    access_code.is_used = True
    db.commit()

    # Generate a temporary, limited-scope access token
    # This token can have a shorter lifespan and a special "role"
    temp_token_data = {
        "sub": str(access_code.email),
        "scope": "view_only",
        "page_route": access_code.page_route
    }
    
    temp_token = create_access_token(temp_token_data, expires_minutes=15) # 15-minute temporary access

    return {
        "message": "Access granted.",
        "access_token": temp_token
    }


@router.get("/pending", response_model=List[AccessCodeSchema])
def get_pending_access_codes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin) # ✅ Restrict access to admins
):
    """
    Retrieves a list of pending (unused) access codes for admin review.
    """
    pending_codes = db.query(AccessCode).filter(AccessCode.is_used == False).all()
    return pending_codes