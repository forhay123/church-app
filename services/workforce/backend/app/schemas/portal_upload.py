from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PortalUploadBase(BaseModel):
    filename: str
    file_url: str
    description: Optional[str] = None
    department_id: Optional[int] = None
    church_id: Optional[int] = None


class PortalUploadCreate(PortalUploadBase):
    pass


class PortalUploadUpdate(BaseModel):
    description: Optional[str] = None
    department_id: Optional[int] = None
    church_id: Optional[int] = None


class PortalUploadOut(PortalUploadBase):
    id: int
    uploaded_at: datetime
    uploaded_by_id: Optional[int]

    class Config:
        orm_mode = True
