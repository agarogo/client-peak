from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base

class GamesResult(Base):
    __tablename__ = "games_result"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)      # если у тебя другие поля — оставь свои
    score = Column(Integer)
    duration_sec = Column(Integer)              # если используешь длительность — ок
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # КЛЮЧЕВОЕ: имя обратной стороны должно существовать в User
    user = relationship("User", back_populates="games_results")