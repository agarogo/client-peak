# app/crud.py
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from passlib.context import CryptContext 
from dotenv import load_dotenv

from app.logging_config import logger

from app.models.users import User
from app.schemas.users import UserCreate, UserUpdate
from app.models.trees import Tree
from app.models.gamesResults import GamesResult

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def calc_cost(base_price: int, lvl: int) -> int:
    # base * 1.6^(lvl-1), rounded
    return int(round(base_price * (1.6 ** (lvl - 1))))

def cooldown(lvl: int) -> timedelta:
    # 15 minutes * lvl
    return timedelta(minutes=15 * lvl)

def create_tree(db: AsyncSession, user_id: int, name: str, price: int) -> Tree:
    tree = Tree(created_by=user_id, name=name, price=price)
    db.add(tree)
    db.commit()
    db.refresh(tree)
    return tree

def list_trees(db: AsyncSession, user_id: int):
    return db.execute(select(Tree).where(Tree.created_by == user_id)).scalars().all()

def get_tree_owned(db: AsyncSession, user_id: int, tree_id: int) -> Tree:
    tree = db.execute(select(Tree).where(Tree.id == tree_id)).scalar_one_or_none()
    if not tree or tree.created_by != user_id:
        raise HTTPException(status_code=404, detail="Tree not found")
    return tree

def update_tree(db: AsyncSession, user_id: int, tree_id: int, name: str | None, price: int | None) -> Tree:
    with db.begin():
        tree = db.execute(select(Tree).where(Tree.id == tree_id).with_for_update()).scalar_one_or_none()
        if not tree or tree.created_by != user_id:
            raise HTTPException(404, "Tree not found")
        if name is not None:
            tree.name = name
        if price is not None:
            tree.price = price
        db.add(tree)
    db.refresh(tree)
    return tree

def upgrade_tree(db: AsyncSession, user_id: int, tree_id: int) -> dict:
    with db.begin():
        # lock tree & user
        tree = db.execute(select(Tree).where(Tree.id == tree_id).with_for_update()).scalar_one_or_none()
        if not tree or tree.created_by != user_id:
            raise HTTPException(404, "Tree not found")

        user = db.execute(select(User).where(User.id == user_id).with_for_update()).scalar_one()
        if tree.lvl >= 5:
            raise HTTPException(409, "Tree at max level")

        cost = calc_cost(tree.price, tree.lvl)
        if (user.coins or 0) < cost:
            raise HTTPException(402, "Not enough coins")

        if now_utc() < (tree.next_upgrade_at or now_utc()):
            raise HTTPException(409, "Upgrade not available yet")

        # Apply upgrade
        user.coins = (user.coins or 0) - cost
        tree.lvl += 1
        tree.next_upgrade_at = now_utc() + cooldown(tree.lvl)
        db.add(user)
        db.add(tree)

    return {"lvl": tree.lvl, "next_upgrade_at": tree.next_upgrade_at.isoformat()}


load_dotenv()

SPECIAL_CHARS = '!@#$%^&*()_-+=№;%:?*'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

"""USER"""
def get_user_by_email(db: AsyncSession, email: str):
    return db.query(User).filter(User.email_corporate == email).first()

def get_user(db: AsyncSession, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

def password_check(user: UserCreate) -> bool:
    password = user.password
    if not (8 <= len(password) <= 40):
        return False
    try:
        name_parts = user.full_name.split()
        if len(name_parts) < 1:
            return False  # Пустое имя недопустимо
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        if first_name in password or (last_name and last_name in password):
            return False
    except IndexError:
        return False
    has_special = any(char in SPECIAL_CHARS for char in password)
    if not has_special:
        return False
    upper_count = sum(1 for char in password if char.isupper())
    lower_count = sum(1 for char in password if char.islower())
    if upper_count + lower_count <= 2:
        return False
    try:
        with open('top_passwords.txt', 'r') as f:
            weak_passwords = {line.strip() for line in f}
        if password in weak_passwords:
            return False
    except FileNotFoundError:
        # Если файл не найден, можно либо вернуть False, либо пропустить эту проверку
        pass  # Предполагаем, что отсутствие файла не блокирует создание 
    return True

async def create_user(db: AsyncSession, user: UserCreate) -> User:
    logger.info(f"Attempting to create user: {user.full_name}")
    logger.info(f"Попытка создания аккаунта для: {user.full_name}")
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        sex=user.sex,
        email_user=user.email_user,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=True,
        login_attempts=0
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    logger.info(f"Создан новый пользователь: {db_user.email_user}, ID: {db_user.id}")
    return db_user

async def get_user(db: AsyncSession, user_id: int):
    res = await db.execute(select(User).where(User.id == user_id))
    return res.scalar_one_or_none()

async def update_user(db: AsyncSession, user_id: int, user_update: UserUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    if all(value is None for value in [user_update.full_name]):
        return db_user  # Ничего не обновляем, возвращаем как есть

    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
        logger.info(db, db_user.id, f"Ваше имя обновлено: {user_update.full_name}")
    if user_update.email_user is not None:
        db_user.email_user = user_update.email_user
        logger.info(db, db_user.id, f"Ваш личный email обновлен: {user_update.email_user}")
    if user_update.sex is not None:
        db_user.sex = user_update.sex
        logger.info(db, db_user.id, f"Ваш пол обновлен: {user_update.sex}")

    db.commit()
    db.refresh(db_user)
    return db_user

async def search_users(db: AsyncSession, full_name: str = None, sex: str = None):
    try:
        query = db.query(User)

        # Фильтрация по full_name
        if full_name:
            query = query.filter(User.full_name.ilike(f"%{full_name}%"))

        # Фильтрация по полу
        if sex:
            if sex not in ["М", "Ж"]:
                raise HTTPException(status_code=422, detail="Invalid sex value. Must be 'М' or 'Ж'")
            query = query.filter(User.sex == sex)

        result = query.all()
        print(f"Search results for filters {locals()}: {[u.full_name for u in result]}")  # Отладка
        return result
    except Exception as e:
        print(f"Search error for filters {locals()}: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error processing filters: {str(e)}")

async def authenticate_user(db: AsyncSession, email: str, password: str):
    logger.info(f"Authentication attempt for email: {email}")
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        logger.warning(f"Authentication failed for {email}: User not found or inactive")
        return False
    if not pwd_context.verify(password, user.hashed_password):
        user.login_attempts += 1
        logger.warning(f"Authentication failed for {email}: Incorrect password, attempts: {user.login_attempts}")
        if user.login_attempts >= 5:
            user.is_active = False
            logger.error(f"User {email} blocked due to too many login attempts")
            # if not has_block_notification(db, user.id):
            #     logger.info(db, user.id, "Ваш аккаунт заблокирован из-за неудачных попыток входа.")
            #     if user.role == "admin":
            #         admins = db.query(User).filter(User.role == "admin").all()
            #         for admin in admins:
            #             if not has_block_notification(db, admin.id):
            #                 logger.info(db, admin.id, f"Пользователь {user.email_corporate} заблокирован из-за неудачных попыток входа.")
        db.commit()
        return False
    
    user.login_attempts = 0 
    db.commit()
    logger.info(f"User {email} authenticated successfully")
    return user 
    

async def award_coins_atomic(db: AsyncSession, user_id: int, coins: int, result_payload: dict) -> GamesResult:
    """
    Сохраняем результат игры и начисляем монеты пользователю в одной транзакции.
    Ожидает, что в GamesResult есть поля как минимум: title (или score), user_id и т.п.
    В games_router мы передаём {"score": ..., "duration_sec": ...} — подгоняй под свою модель.
    """
    if coins < 0:
        raise HTTPException(status_code=400, detail="Coins must be non-negative")

    with db.begin():
        # 1) Пишем результат игры
        result = GamesResult(user_id=user_id, **result_payload)
        db.add(result)

        # 2) Начисляем монеты
        user = db.execute(select(User).where(User.id == user_id).with_for_update()).scalar_one()
        user.coins = (user.coins or 0) + coins
        db.add(user)

    db.refresh(result)
    return result