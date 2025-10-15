from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base

class GamesResult(Base):
    __tablename__ = "games_result"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    score = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)

    user = relationship("User", back_populates="game_result")