from fastapi import APIRouter

from . import users, auth_main, quizes

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth_main.router, prefix="/auth", tags=["auth"])
api_router.include_router(quizes.router, prefix="/auth", tags=["quiz"])