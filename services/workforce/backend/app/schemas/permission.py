from pydantic import BaseModel

class Permission(BaseModel):
    id: int
    resource: str
    can_access: bool

    class Config:
        from_attributes = True  # ✅ Pydantic v2 replacement for orm_mode
