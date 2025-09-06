from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.message import ContentType


class MessageResponseOut(BaseModel):
    responder: str
    acknowledged: bool
    text: Optional[str] = None


class MessageOut(BaseModel):
    id: int
    sender: str
    receiver_roles: List[str]  # ✅ Changed to a list
    content_type: ContentType
    text: Optional[str]
    content_url: Optional[str]
    created_at: datetime
    responses: List[MessageResponseOut] = []

    class Config:
        orm_mode = True