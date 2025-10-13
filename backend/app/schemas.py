from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime, date
"""СТРУКТУРЫ ДАННЫХ"""

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

"""КЛАССЫ USER"""
class UserBase(BaseModel):
    full_name: str
    birthday: date
    sex: str
    email_user: Optional[EmailStr] = None
    email_corporate: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    tg_name: str
    position_employee: str
    subdivision: str
    role: UserRole

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    birthday: Optional[date] = None
    sex: Optional[str] = None
    email_user: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    tg_name: Optional[str] = None
    position_employee: Optional[str] = None
    subdivision: Optional[str] = None
    role: Optional[UserRole] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    login_attempts: int
    created_at: datetime

    class Config:
        orm_mode = True  

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


"""КЛАССЫ TOKENA"""
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None