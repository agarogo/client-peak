from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.users import User
from app.models.questions import Question
from app.schemas.quizes import QuizSubmission, QuizResult

router = APIRouter(prefix="/quizes", tags=["quizes"])
limiter = Limiter(key_func=get_remote_address)

"""GET"""
@router.get("/questions/")
def get_questions(db: Session = Depends(get_db)):
    return db.query(Question).offset(0).limit(25).all()

@router.post("/submit/", response_model=QuizResult)
def submit_quiz(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(Question).offset(submission.skip).limit(submission.limit).all()

    if not questions:
        raise HTTPException(status_code=404, detail="Вопросы не найдены")

    correct_count = 0

    for question in questions:
        user_answer = submission.answers.get(str(question.id))
        if user_answer == question.correct_answer:
            correct_count += 1


    db.commit()

    return QuizResult(
        score = correct_count,
        user_id = current_user.id
    )