# backend/app/schemas/access_code.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class AccessCodeRequest(BaseModel):
    email: EmailStr
    page_route: str

class AccessCodeCreate(BaseModel):
    email: EmailStr
    code: str
    page_route: str

class AccessCodeVerification(BaseModel):
    email: EmailStr
    code: str
    page_route: str
    
class AccessCodeResponse(BaseModel):
    message: str
    access_token: Optional[str] = None

# ✅ Add this new Pydantic model
class AccessCode(BaseModel):
    id: int
    email: EmailStr
    code: str
    page_route: str
    is_used: bool
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True # This replaces orm_mode=True in Pydantic v2