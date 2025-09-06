from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import create_email_token, verify_email_token, get_password_hash
from app.services.email_service import send_email
from app.core.config import settings

def send_verification_email(user: User, db: Session):
    token = create_email_token({"sub": str(user.id)})
    user.verification_token = token
    db.commit()
    db.refresh(user)

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "Verify your email"
    body = f"<p>Hello {user.name},</p><p>Please verify your email by clicking the link below:</p><a href='{verify_url}'>Verify Email</a>"
    send_email(user.email, subject, body)


def verify_user_email(token: str, db: Session) -> bool:
    payload = verify_email_token(token)
    if not payload:
        return False
    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user or user.verification_token != token:
        return False
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return True


def send_password_reset_email(user: User, db: Session):
    token = create_email_token({"sub": str(user.id)}, expires_minutes=30)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=30)
    db.commit()
    db.refresh(user)

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset your password"
    body = f"<p>Hello {user.name},</p><p>Click the link below to reset your password:</p><a href='{reset_url}'>Reset Password</a>"
    send_email(user.email, subject, body)


def reset_password(token: str, new_password: str, db: Session) -> bool:
    payload = verify_email_token(token)
    if not payload:
        return False
    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user or user.reset_token != token:
        return False
    if user.reset_token_expiry < datetime.utcnow():
        return False
    user.password_hash = get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return True
