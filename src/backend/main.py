from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.api import auth
from src.backend.api import users
from src.backend.api import chat

app = FastAPI()

# 프론트엔드(Live Server 등 다른 포트)에서 API 호출 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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