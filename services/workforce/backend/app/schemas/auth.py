from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: str | None = None

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    address: Optional[str] = None
    birthday: Optional[str] = None  # YYYY-MM-DD format
    phone: Optional[str] = None
    sex: Optional[str] = None
    church_id: Optional[int] = None
    department_id: Optional[int] = None

