from fastapi import APIRouter
from . import users, auth_main, quizes, trees
from .quizes_ import games_router, import_router

api_router = APIRouter()

# users/auth
api_router.include_router(users.router, tags=["users"])
api_router.include_router(auth_main.router, prefix="/auth", tags=["auth"])

# quizzes
api_router.include_router(quizes.router)  # if quizes.router has prefix="/quizes" inside
api_router.include_router(games_router.router, prefix="/quizes/games", tags=["quiz"])
api_router.include_router(import_router.router, prefix="/quizes/import", tags=["quiz"])

# trees
api_router.include_router(trees.router, prefix="/trees", tags=["trees"])
