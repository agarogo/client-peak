# app/routers/quizes/import_router.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.questions import Question

router = APIRouter()

def parse_blocks(text: str):
    # 6 lines per block: Q, correct, wrong1, wrong2, wrong3, blank
    blocks = []
    lines = [l.rstrip("\n\r") for l in text.splitlines()]
    i = 0
    while i + 5 < len(lines):
        q = lines[i].strip()
        correct = lines[i+1].strip()
        wrongs = [lines[i+2].strip(), lines[i+3].strip(), lines[i+4].strip()]
        # lines[i+5] is blank separator
        blocks.append((q, correct, wrongs))
        i += 6
    return blocks

@router.post("/text", summary="Bulk import questions (6-line blocks)")
async def import_questions_text(request: Request, db: Session = Depends(get_db), user=Depends(get_current_user)):
    text = await request.body()
    try:
        text = text.decode("utf-8")
    except Exception:
        raise HTTPException(400, "Expecting UTF-8 text/plain body")
    blocks = parse_blocks(text)
    if not blocks:
        raise HTTPException(400, "No question blocks found")

    created = 0
    for q, correct, wrongs in blocks:
        item = Question(
            question_text=q,
            correct_answer=correct,
            option1=wrongs[0],
            option2=wrongs[1],
            option3=wrongs[2]
        )
        db.add(item)
        created += 1
    db.commit()
    return {"ok": True, "created": created}
