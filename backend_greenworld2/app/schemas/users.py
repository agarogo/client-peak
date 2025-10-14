from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

"""СТРУКТУРЫ ДАННЫХ"""

"""КЛАССЫ USER"""
class UserBase(BaseModel):
    full_name: str
    sex: str
    email_user: Optional[EmailStr] = None
    coins: int

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    sex: Optional[str] = None
    email_user: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    login_attempts: int
    created_at: datetime

    class Config:
        orm_mode = True  