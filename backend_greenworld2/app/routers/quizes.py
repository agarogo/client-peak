# app/routers/quizes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.users import User
from app.models.questions import Question
from app.schemas.quizes import QuizSubmission, QuizResult

router = APIRouter(prefix="/quizes", tags=["quizes"])
limiter = Limiter(key_func=get_remote_address)

@router.get("/questions/")
async def get_questions(
    skip: int = 0, 
    limit: int = 25,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Question).offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.post("/submit/", response_model=QuizResult)
async def submit_quiz(
    submission: QuizSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Question).offset(submission.skip).limit(submission.limit)
    )
    questions = result.scalars().all()

    if not questions:
        raise HTTPException(status_code=404, detail="Вопросы не найдены")

    correct_count = 0
    for question in questions:
        user_answer = submission.answers.get(str(question.id))
        if user_answer == question.correct_answer:
            correct_count += 1

    return QuizResult(
        score=correct_count,
        user_id=current_user.id
    )