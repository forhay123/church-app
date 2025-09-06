from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.roles import Role
from app.services.auth_service import (
    send_verification_email,
    verify_user_email,
    send_password_reset_email,
    reset_password as reset_password_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ✅ Login
@router.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value if user.role else None,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "church_id": user.church_id,
        "department_id": user.department_id,
    }


# ✅ Register (sends verification email)
@router.post("/register")
def register_user(register: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == register.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        name=register.name,
        email=register.email,
        password_hash=get_password_hash(register.password),
        role=Role.MEMBER,
        address=register.address,
        birthday=register.birthday,
        phone=register.phone,
        sex=register.sex,
        church_id=register.church_id,
        department_id=register.department_id,
        is_verified=False,  # 👈 unified flag
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    send_verification_email(user, db)

    return {"message": "User registered. Please verify email to activate account."}


# ✅ Verify Email
@router.post("/verify-email")
def verify_email(token: str = Body(..., embed=True), db: Session = Depends(get_db)):
    if not verify_user_email(token, db):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"message": "Email verified successfully!"}


# ✅ Forgot Password
@router.post("/forgot-password")
def forgot_password(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    send_password_reset_email(user, db)
    return {"message": "Password reset link sent to your email"}


# ✅ Reset Password
@router.post("/reset-password")
def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db),
):
    if not reset_password_service(token, new_password, db):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"message": "Password reset successfully"}
