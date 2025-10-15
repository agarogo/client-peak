from pydantic import BaseModel
from typing import Optional

"""КЛАССЫ TOKENA"""
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None