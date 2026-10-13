from fastapi import FastAPI

from src.backend.api import auth
from src.backend.api import users
from src.backend.api import chat

app = FastAPI()

app.include_router(
    auth.router,
    prefix="/api/auth",
)

app.include_router(
    users.router,
    prefix="/api/users",
)

app.include_router(
    chat.router,
    prefix="/api/chat",
)