# app/routers/quizes/games_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.database import get_db
from app.dependencies import get_current_user
from app.crud import award_coins_atomic

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/result")
async def post_game_result(payload: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # Your scoring logic; for example:
    score = payload.get("score", 0)
    duration = payload.get("duration_sec", 0)
    # Convert score -> coins (tweak formula as needed)
    coins = max(0, score // 2)

    # Persist atomically
    result = award_coins_atomic(
        db=db,
        user_id=user.id,
        coins=coins,
        result_payload={"score": score, "duration_sec": duration}
    )
    return {"ok": True, "awarded": coins, "result_id": result.id}
