from pydantic import BaseModel

class TreeBase(BaseModel):
    type: str
    owner_id: int

class TreeCreate(TreeBase):
    pass

class TreeRead(TreeBase):
    id: int
    class Config:
        from_attributes = True
