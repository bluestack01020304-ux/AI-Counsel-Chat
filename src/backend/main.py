from fastapi import FastAPI
from .main import init

init()

from api import auth
from api import users
from api import chat

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