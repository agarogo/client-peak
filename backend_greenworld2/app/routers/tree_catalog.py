from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.database import get_db
from app.schemas.tree_catalog import TreeCatalogOut
from app.crud import get_tree_catalog, buy_and_plant_tree, init_tree_catalog
from app.dependencies import get_current_user
from app.models.users import User
from app.models.trees import Tree
from app.schemas.trees import TreeOut

router = APIRouter(prefix="/tree-catalog", tags=["tree-catalog"])

@router.get("/", response_model=List[TreeCatalogOut])
async def get_catalog(db: AsyncSession = Depends(get_db)):
    """Получить весь каталог деревьев"""
    return await get_tree_catalog(db)

@router.post("/buy/{tree_type_id}", response_model=TreeOut)
async def buy_tree(
    tree_type_id: int,
    custom_name: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Купить и посадить дерево из каталога"""
    return await buy_and_plant_tree(db, current_user.id, tree_type_id, custom_name)

@router.post("/init")
async def initialize_catalog(db: AsyncSession = Depends(get_db)):
    """Инициализировать каталог деревьев (для админа)"""
    await init_tree_catalog(db)
    return {"message": "Tree catalog initialized"}