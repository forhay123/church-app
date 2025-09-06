 
from pydantic import BaseModel
from typing import Optional

class ChurchBase(BaseModel):
    name: str
    location: Optional[str] = None

class ChurchCreate(ChurchBase):
    pass

class ChurchOut(ChurchBase):
    id: int
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    church_id: int

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    pass

class GroupOut(GroupBase):
    id: int
    class Config:
        from_attributes = True
