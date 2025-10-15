from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func

from app.db.database import Base

class News(Base):
    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    cost =  Column(Integer, nullable = False)
    lvl = Column(Integer, nullable = False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint('lvl >= 1 AND lvl <= 5', name='check_lvl_range'),
    )