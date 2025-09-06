from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, Literal
from datetime import datetime

class ExtraDetail(BaseModel):
    value: float
    type: Literal["Credit", "Debit", "None"] = "None"  # default to None if unspecified

class FinanceBase(BaseModel):
    service_name: str
    service_date: datetime
    venue: Optional[str] = None
    host: Optional[str] = None
    hours: Optional[int] = None
    offerings: Optional[float] = 0.0
    partnership_offering: Optional[float] = 0.0
    extra_details: Optional[Dict[str, ExtraDetail]] = {}
    church_id: int

    @validator("extra_details", pre=True, always=True)
    def convert_extra_details(cls, v):
        """
        Ensures extra_details is a dict of {key: {value, type}}
        Converts numeric strings to float/int, sets default type if missing.
        """
        if not v:
            return {}
        converted = {}
        for key, val in v.items():
            if isinstance(val, dict):
                value = val.get("value", 0)
                type_ = val.get("type", "None")
                # Convert numeric strings to float/int
                try:
                    value = float(value) if "." in str(value) else int(value)
                except (ValueError, TypeError):
                    value = 0
                converted[key] = ExtraDetail(value=value, type=type_)
            else:
                # If val is just a number/string, wrap it as Credit by default
                try:
                    num_val = float(val) if "." in str(val) else int(val)
                except (ValueError, TypeError):
                    num_val = 0
                converted[key] = ExtraDetail(value=num_val, type="Credit")
        return converted

class FinanceCreate(FinanceBase):
    pass

class FinanceUpdate(BaseModel):
    service_name: Optional[str] = None
    service_date: Optional[datetime] = None
    venue: Optional[str] = None
    host: Optional[str] = None
    hours: Optional[int] = None
    offerings: Optional[float] = None
    partnership_offering: Optional[float] = None
    extra_details: Optional[Dict[str, ExtraDetail]] = None
    church_id: Optional[int] = None

    @validator("extra_details", pre=True, always=True)
    def convert_extra_details(cls, v):
        if not v:
            return {}
        converted = {}
        for key, val in v.items():
            if isinstance(val, dict):
                value = val.get("value", 0)
                type_ = val.get("type", "None")
                try:
                    value = float(value) if "." in str(value) else int(value)
                except (ValueError, TypeError):
                    value = 0
                converted[key] = ExtraDetail(value=value, type=type_)
            else:
                try:
                    num_val = float(val) if "." in str(val) else int(val)
                except (ValueError, TypeError):
                    num_val = 0
                converted[key] = ExtraDetail(value=num_val, type="Credit")
        return converted

class FinanceOut(FinanceBase):
    id: int
    created_by_id: int
    confirmed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
