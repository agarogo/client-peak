from pydantic import BaseModel
from typing import Optional, List, Dict

# ----- QUESTION -----
class QuestionBase(BaseModel):
    question_text: str
    correct_answer: str
    option1: str
    option2: str
    option3: str

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int

    class Config:
        from_attributes = True

# ----- QUIZ RESULT -----
class QuizResultCreate(BaseModel):
    score: int
    total_questions: int

class QuizResult(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    score: int

    class Config:
        from_attributes = True

# ----- QUIZ SUBMISSION -----
class QuizSubmission(BaseModel):
    answers: Dict[str, str]
    test_type: int
    skip: int
    limit: int
    
class UserRating(BaseModel):
    nickname: str
    avg_percentage: float