from pydantic import BaseModel, conint, constr
from typing import Optional
from datetime import datetime

class TreeCreate(BaseModel):
    name: constr(min_length=1, max_length=100)
    price: conint(ge=0)

class TreeUpdate(BaseModel):
    name: Optional[constr(min_length=1, max_length=100)] = None
    price: Optional[conint(ge=0)] = None

class TreeOut(BaseModel):
    id: int
    created_by: int
    name: str
    price: int
    lvl: conint(ge=1, le=5)
    next_upgrade_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2; in v1 this is ignored but safe
        orm_mode = True         # Pydantic v1 compatibility
