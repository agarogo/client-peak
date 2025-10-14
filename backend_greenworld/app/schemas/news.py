from pydantic import BaseModel
from typing import Optional
from datetime import datetime

"""NEWS"""
class NewsBase(BaseModel):
    title: str
    content: str

class NewsCreate(NewsBase):
    pass

class NewsUpdate(NewsBase):
    is_active: Optional[bool] = None

class NewsInDB(NewsBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True