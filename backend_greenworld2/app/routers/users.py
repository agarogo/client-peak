from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.users import UserCreate, UserInDB, UserUpdate
from app.crud import get_user as get_user_crud, create_user, update_user, search_users as search_users_crud, password_check
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.users import User
from app.tasks import generate_email_for_employee
from app.logging_config import logger

router = APIRouter(prefix="/users", tags=["users"])
limiter = Limiter(key_func=get_remote_address)

"""POST"""
"""СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ"""
@router.post("/", response_model=UserInDB)
@limiter.limit("50/hour")
async def create_user_endpoint(
    request: Request, 
    user: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    
    user_dict = user.dict(exclude_unset=True)
        
    if (password_check(user)):
        logger.info(f"Создан аккаунт {user_dict['email_user']}")
        new_user = await create_user(db=db, user=UserCreate(**user_dict))
        return new_user
    else:
        logger.warning(f"Ошибка создания пользователя - {user.full_name}: Слабый пароль")
        raise HTTPException(status_code=403, detail="Weak password")

"""GET"""
"""ИНФОРМАЦИЯ О СЕБЕ"""
@router.get("/me", response_model=UserInDB)
@limiter.limit("30/minute")
def read_users_me(
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    return current_user

"""ПОИСК СОТРУДНИКА"""
# @router.get("/", response_model=List[UserInDB])
# @limiter.limit("30/minute")
# def search_users(
#     request: Request, 
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
#     full_name: Optional[str] = Query(None, description="Поиск по полному имени (имя, фамилия, отчество)"),
#     role: Optional[UserRole] = Query(None, description="Фильтр по роли (admin, manager, user)"),
#     sex: Optional[str] = Query(None, description="Фильтр по полу (М или Ж)"),
#     position_employee: Optional[str] = Query(None, description="Фильтр по должности"),
#     skip: int = 0,
#     limit: int = 10
# ):
#     # Собираем параметры фильтрации
#     filters = {
#         "full_name": full_name,
#         "role": role,
#         "sex": sex,
#         "position_employee": position_employee
#     }
#     logger.info(f"User {current_user.email_corporate} searching users with filters: {filters}")
#     users = search_users_crud(db, **filters)
#     logger.info(f"User {current_user.email_corporate} found {len(users)} users")
#     return users[skip:skip + limit]

"""ПРОСМОТР СОТРУДНИКА"""
@router.get("/{user_id}", response_model=UserInDB)
@limiter.limit("50/minute")
async def get_user(
    request: Request, 
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)  # Доступно для всех авторизованных пользователей
):
    db_user = await get_user_crud(db, user_id)  # ← async CRUD
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserInDB.model_validate(db_user, from_attributes=True)

"""ПРОСМОТР УВЕДОМЛЕНИЙ"""
# @router.get("/me/notifications", response_model=List[dict])

# def get_notifications(
#     request: Request, 
#     current_user: UserInDB = Depends(get_current_user), 
#     db: Session = Depends(get_db)
# ):
#     notifications = get_user_notifications(db, current_user.id)
#     logger.info(f"User {current_user.email_corporate} viewed their notifications ({len(notifications)} found)")
#     return [{"id": n.id, "message": n.message, "is_read": n.is_read, "created_at": n.created_at} for n in notifications]

"""PUT"""
"""ИЗМЕНЕНИЕ СВОИХ ДАННЫХ"""
@router.put("/me", response_model=UserInDB)
@limiter.limit("10/minute")
def update_user_me(
    request: Request, 
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"User {current_user.email_corporate} updating their own data: {user_update.dict(exclude_unset=True)}")
    return update_user(db, current_user.id, user_update)

"""ИЗМЕНЕНИЕ ДАННЫХ СОТРУДНИКА АДМИНОМ"""
# @router.put("/{user_id}", response_model=UserInDB)
# @limiter.limit("10/minute")
# def update_user_endpoint(
#     request: Request, 
#     user_id: int,
#     user_update: UserUpdate,
#     db: Session = Depends(get_db),
#     current_user: UserInDB = Depends(get_admin_user)
# ):
#     logger.info(f"Admin {current_user.email_corporate} updating user ID {user_id} with: {user_update.dict(exclude_unset=True)}")
#     db_user = update_user(db, user_id, user_update)
#     if db_user is None:
#         logger.warning(f"Admin {current_user.email_corporate} failed to update user ID {user_id}: User not found")
#         raise HTTPException(status_code=404, detail="User not found")
#     return db_user