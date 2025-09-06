# backend/app/routers/auth_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import auth, database, models, schemas
from app.dependencies import get_current_user
from app.models import User
from sqlalchemy.orm import joinedload

router = APIRouter(
    prefix="",
    tags=["Auth"]
)


@router.post("/token", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid username or password"
        )

    access_token = auth.create_access_token(data={
        "sub": user.username,
        "user_id": user.id,
        "role": user.role or "student"
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ✅ User info (same as /users/me, consistent schemas)
@router.get("/auth/user-info", response_model=schemas.MeResponse)
def get_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role == "teacher":
        teacher = (
            db.query(models.TeacherProfile)
            .options(joinedload(models.TeacherProfile.user))
            .filter(models.TeacherProfile.user_id == current_user.id)
            .first()
        )
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        return schemas.TeacherProfileWithUser.from_orm(teacher)

    elif current_user.role == "student":
        student = (
            db.query(models.StudentProfile)
            .options(joinedload(models.StudentProfile.user))
            .filter(models.StudentProfile.user_id == current_user.id)
            .first()
        )
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")
        return schemas.StudentProfileOut.from_orm(student)

    return schemas.UserOut.from_orm(current_user)
