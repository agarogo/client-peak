# app/crud.py
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException
from passlib.context import CryptContext 
from dotenv import load_dotenv

from app.logging_config import logger
from app.models.users import User
from app.schemas.users import UserCreate, UserUpdate
from app.models.trees import Tree
from app.models.gamesResults import GamesResult
from app.models.tree_catalog import TreeCatalog

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def calc_cost(base_price: int, lvl: int) -> int:
    return int(round(base_price * (1.6 ** (lvl - 1))))

def cooldown(lvl: int) -> timedelta:
    return timedelta(minutes=15 * lvl)

async def get_tree_catalog(db: AsyncSession):
    """Получить весь каталог деревьев"""
    result = await db.execute(select(TreeCatalog))
    return result.scalars().all()

async def get_tree_catalog_item(db: AsyncSession, tree_type_id: int):
    """Получить конкретный тип дерева из каталога"""
    result = await db.execute(select(TreeCatalog).where(TreeCatalog.id == tree_type_id))
    return result.scalar_one_or_none()

async def buy_and_plant_tree(db: AsyncSession, user_id: int, tree_type_id: int, custom_name: str = None):
    """
    Покупка и посадка дерева из каталога
    """
    # Получаем тип дерева из каталога
    tree_catalog = await get_tree_catalog_item(db, tree_type_id)
    if not tree_catalog:
        raise HTTPException(status_code=404, detail="Tree type not found")
    
    # Получаем пользователя
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one()
    
    # Проверяем достаточно ли монет
    if user.coins < tree_catalog.price:
        raise HTTPException(status_code=402, detail="Not enough coins")
    
    # Создаем дерево
    tree_name = custom_name or tree_catalog.name
    tree = Tree(
        created_by=user_id,
        tree_type_id=tree_type_id,
        name=tree_name,
        price=tree_catalog.price  # Сохраняем цену покупки
    )
    
    # Вычитаем монеты
    user.coins -= tree_catalog.price
    
    db.add(tree)
    await db.commit()
    await db.refresh(tree)
    
    return tree

async def init_tree_catalog(db: AsyncSession):
    """Инициализация каталога деревьев (вызвать один раз при старте)"""
    # Проверяем, есть ли уже деревья в каталоге
    result = await db.execute(select(TreeCatalog))
    existing_trees = result.scalars().all()
    
    if not existing_trees:
        # Добавляем деревья в каталог
        trees = [
            TreeCatalog(
                name="Береза",
                price=25,
                description="Изящное дерево с белой корой"
            ),
            TreeCatalog(
                name="Дуб",
                price=50,
                description="Могучий и долговечный"
            ),
            TreeCatalog(
                name="Сосна",
                price=30,
                description="Вечнозеленое хвойное дерево"
            ),
            TreeCatalog(
                name="Клен",
                price=40,
                description="Дерево с красивыми резными листьями"
            )
        ]
        
        for tree in trees:
            db.add(tree)
        
        await db.commit()
        print("Tree catalog initialized")

async def create_tree(db: AsyncSession, user_id: int, tree_type_id: int, custom_name: str = None) -> Tree:
    """Создание дерева из каталога (альтернатива buy_and_plant_tree)"""
    return await buy_and_plant_tree(db, user_id, tree_type_id, custom_name)

async def list_trees(db: AsyncSession, user_id: int):
    result = await db.execute(select(Tree).where(Tree.created_by == user_id))
    return result.scalars().all()

async def get_tree_owned(db: AsyncSession, user_id: int, tree_id: int) -> Tree:
    result = await db.execute(select(Tree).where(Tree.id == tree_id))
    tree = result.scalar_one_or_none()
    if not tree or tree.created_by != user_id:
        raise HTTPException(status_code=404, detail="Tree not found")
    return tree

async def update_tree(db: AsyncSession, user_id: int, tree_id: int, name: str | None, price: int | None) -> Tree:
    result = await db.execute(select(Tree).where(Tree.id == tree_id))
    tree = result.scalar_one_or_none()
    if not tree or tree.created_by != user_id:
        raise HTTPException(status_code=404, detail="Tree not found")
    
    if name is not None:
        tree.name = name
    if price is not None:
        tree.price = price
    
    await db.commit()
    await db.refresh(tree)
    return tree

async def upgrade_tree(db: AsyncSession, user_id: int, tree_id: int, use_coins: bool = True) -> dict:
    # Получаем дерево и пользователя
    tree_result = await db.execute(select(Tree).where(Tree.id == tree_id))
    tree = tree_result.scalar_one_or_none()
    if not tree or tree.created_by != user_id:
        raise HTTPException(status_code=404, detail="Tree not found")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one()
    
    if tree.lvl >= 5:
        raise HTTPException(status_code=409, detail="Tree at max level")

    if use_coins:
        cost = calc_cost(tree.price, tree.lvl)
        if (user.coins or 0) < cost:
            raise HTTPException(status_code=402, detail="Not enough coins")
        user.coins = (user.coins or 0) - cost

    if tree.next_upgrade_at and now_utc() < tree.next_upgrade_at:
        raise HTTPException(status_code=409, detail="Upgrade not available yet")

    tree.lvl += 1
    tree.next_upgrade_at = now_utc() + cooldown(tree.lvl)
    
    await db.commit()
    await db.refresh(tree)
    
    return {"lvl": tree.lvl, "next_upgrade_at": tree.next_upgrade_at.isoformat()}

load_dotenv()

SPECIAL_CHARS = '!@#$%^&*()_-+=№;%:?*'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(
        select(User).where((User.email_user == email))
    )
    return result.scalar_one_or_none()

def password_check(user: UserCreate) -> bool:
    password = user.password
    if not (8 <= len(password) <= 40):
        return False
    
    try:
        name_parts = user.full_name.split()
        if len(name_parts) < 1:
            return False
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        if first_name.lower() in password.lower() or (last_name and last_name.lower() in password.lower()):
            return False
    except Exception:
        return False
    
    has_special = any(char in SPECIAL_CHARS for char in password)
    if not has_special:
        return False
    
    upper_count = sum(1 for char in password if char.isupper())
    lower_count = sum(1 for char in password if char.islower())
    if upper_count + lower_count <= 2:
        return False
    
    try:
        with open('top_passwords.txt', 'r', encoding='utf-8') as f:
            weak_passwords = {line.strip() for line in f}
        if password in weak_passwords:
            return False
    except FileNotFoundError:
        pass
    
    return True

async def create_user(db: AsyncSession, user: UserCreate) -> User:
    logger.info(f"Attempting to create user: {user.full_name}")
    
    existing_user = await get_user_by_email(db, user.email_user)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if not password_check(user):
        logger.warning(f"Weak password for user: {user.full_name}")
        raise HTTPException(status_code=400, detail="Weak password")
    
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        sex=user.sex,
        email_user=user.email_user,
        hashed_password=hashed_password,
        full_name=user.full_name,
        coins=getattr(user, 'coins', 0),
        is_active=True,
        login_attempts=0
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    logger.info(f"Created new user: {db_user.email_user}, ID: {db_user.id}")
    return db_user

async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def update_user(db: AsyncSession, user_id: int, user_update: UserUpdate):
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def search_users(db: AsyncSession, full_name: str = None, sex: str = None):
    query = select(User)

    if full_name:
        query = query.where(User.full_name.ilike(f"%{full_name}%"))

    if sex:
        if sex not in ["М", "Ж"]:
            raise HTTPException(status_code=422, detail="Invalid sex value. Must be 'М' or 'Ж'")
        query = query.where(User.sex == sex)

    result = await db.execute(query)
    return result.scalars().all()

async def authenticate_user(db: AsyncSession, email: str, password: str):
    logger.info(f"Authentication attempt for email: {email}")
    user = await get_user_by_email(db, email)
    
    if not user or not user.is_active:
        logger.warning(f"Authentication failed for {email}: User not found or inactive")
        return False
    
    if not pwd_context.verify(password, user.hashed_password):
        user.login_attempts += 1
        logger.warning(f"Authentication failed for {email}: Incorrect password, attempts: {user.login_attempts}")
        
        if user.login_attempts >= 5:
            user.is_active = False
            logger.error(f"User {email} blocked due to too many login attempts")
        
        await db.commit()
        return False
    
    user.login_attempts = 0
    await db.commit()
    logger.info(f"User {email} authenticated successfully")
    return user

async def award_coins_atomic(db: AsyncSession, user_id: int, coins: int, result_payload: dict) -> GamesResult:
    if coins < 0:
        raise HTTPException(status_code=400, detail="Coins must be non-negative")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = GamesResult(user_id=user_id, **result_payload)
    db.add(result)

    user.coins = (user.coins or 0) + coins

    await db.commit()
    await db.refresh(result)
    
    return result