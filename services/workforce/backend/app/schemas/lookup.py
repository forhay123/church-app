# app/schemas/lookup.py
from pydantic import BaseModel

class ChurchSchema(BaseModel):
    id: int
    name: str
    location: str

    class Config:
        orm_mode = True

class DepartmentSchema(BaseModel):
    id: int
    name: str
    church_id: int

    class Config:
        orm_mode = True
