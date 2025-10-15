# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.users import UserCreate, UserInDB, UserUpdate
from app.crud import get_user as get_user_crud, create_user, update_user, search_users as search_users_crud
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.users import User
from app.logging_config import logger

router = APIRouter(prefix="/users", tags=["users"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/", response_model=UserInDB)
@limiter.limit("50/hour")
async def create_user_endpoint(
    request: Request, 
    user: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    try:
        new_user = await create_user(db=db, user=user)
        return new_user
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me", response_model=UserInDB)
@limiter.limit("30/minute")
async def read_users_me(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.get("/{user_id}", response_model=UserInDB)
@limiter.limit("50/minute")
async def get_user(
    request: Request, 
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_user = await get_user_crud(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/me", response_model=UserInDB)
@limiter.limit("10/minute")
async def update_user_me(
    request: Request, 
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"User {current_user.email_user} updating their own data")
    return await update_user(db, current_user.id, user_update)

@router.get("/", response_model=List[UserInDB])
async def search_users(
    full_name: str = None,
    sex: str = None,
    db: AsyncSession = Depends(get_db)
):
    return await search_users_crud(db, full_name=full_name, sex=sex)