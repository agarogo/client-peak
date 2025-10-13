from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.base import Base

class Tree(Base):
    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
