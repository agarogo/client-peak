from fastapi import APIRouter
from . import users, trees

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(trees.router, prefix="/trees", tags=["trees"])
