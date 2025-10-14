from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.schemas.trees import TreeCreate, TreeUpdate, TreeOut
from app.models.trees import Tree
from app.models.users import User
from app.crud import get_tree_owned, upgrade_tree

# Use the project's real JWT dependency
from app.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[TreeOut])
def my_trees(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.execute(select(Tree).where(Tree.created_by == user.id)).scalars().all()

@router.post("", response_model=TreeOut, status_code=201)
def create_tree(payload: TreeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tree = Tree(created_by=user.id, name=payload.name, price=payload.price)
    db.add(tree); db.commit(); db.refresh(tree)
    return tree

@router.get("/{tree_id}", response_model=TreeOut)
def get_tree_endpoint(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_tree_owned(db, user.id, tree_id)

@router.patch("/{tree_id}", response_model=TreeOut)
def update_tree_endpoint(tree_id: int, payload: TreeUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    with db.begin():
        tree = db.execute(select(Tree).where(Tree.id == tree_id).with_for_update()).scalar_one_or_none()
        if not tree or tree.created_by != user.id:
            raise HTTPException(404, "Tree not found")
        if payload.name is not None:
            tree.name = payload.name
        if payload.price is not None:
            tree.price = payload.price
        db.add(tree)
    db.refresh(tree)
    return tree

@router.post("/{tree_id}/upgrade")
def upgrade_tree_endpoint(tree_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # If you don't want coin economy yet, set use_coins=False in crud.upgrade_tree
    return upgrade_tree(db, user.id, tree_id, use_coins=True)
