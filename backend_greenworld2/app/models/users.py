from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    sex = Column(String, nullable=True)
    email_user = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    login_attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    coins = Column(Integer, default = 0)

    games_results = relationship(
        "GamesResult",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=False,
    )
    trees = relationship("Tree", back_populates="user")