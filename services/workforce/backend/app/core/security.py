# app/core/security.py

from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer # This is already imported, good!
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings
from app.models.user import User # This is already imported, good!
from app.db.session import get_db # This is already imported, good!
from sqlalchemy.orm import Session # This is already imported, good!

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

# ✅ Add this line to define the oauth2_scheme instance
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def create_access_token(data: dict, expires_minutes: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # A more detailed exception is better for debugging on the frontend
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(plain: str) -> str:
    return pwd_context.hash(plain)

def get_current_user(
    db: Session = Depends(get_db),
    # ✅ This line will now correctly reference oauth2_scheme
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user

def create_email_token(data: dict, expires_minutes: int = 60 * 24):
    """Create a short-lived token for email verification or reset."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def verify_email_token(token: str) -> Optional[dict]:
    """Decode and validate email token"""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None