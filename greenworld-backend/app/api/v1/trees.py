from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.tree import Tree
from app.schemas.tree import TreeCreate, TreeRead

router = APIRouter()

@router.post("/", response_model=TreeRead)
async def plant_tree(tree: TreeCreate, db: AsyncSession = Depends(get_db)):
    new_tree = Tree(type=tree.type, owner_id=tree.owner_id)
    db.add(new_tree)
    await db.commit()
    await db.refresh(new_tree)
    return new_tree

@router.get("/", response_model=list[TreeRead])
async def list_trees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tree))
    return result.scalars().all()
