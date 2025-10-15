# app/routers/trees.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.schemas.trees import TreeCreate, TreeUpdate, TreeOut
from app.models.trees import Tree
from app.models.users import User
from app.crud import get_tree_owned, upgrade_tree, list_trees, update_tree as crud_update_tree
from app.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[TreeOut])
async def my_trees(
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Получить все мои деревья"""
    return await list_trees(db, user.id)

@router.get("/{tree_id}", response_model=TreeOut)
async def get_tree_endpoint(
    tree_id: int, 
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Получить конкретное дерево"""
    return await get_tree_owned(db, user.id, tree_id)

@router.patch("/{tree_id}", response_model=TreeOut)
async def update_tree_endpoint(
    tree_id: int, 
    payload: TreeUpdate, 
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Обновить имя дерева"""
    return await crud_update_tree(db, user.id, tree_id, payload.name, payload.price)

@router.post("/{tree_id}/upgrade")
async def upgrade_tree_endpoint(
    tree_id: int, 
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """Улучшить дерево"""
    return await upgrade_tree(db, user.id, tree_id, use_coins=True)