from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    age: int

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: int
    class Config:
        from_attributes = True
