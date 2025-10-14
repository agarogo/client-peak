from sqlalchemy import Column, Integer, String

from app.db.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String, index=True)
    correct_answer = Column(String)
    option1 = Column(String)
    option2 = Column(String)
    option3 = Column(String)