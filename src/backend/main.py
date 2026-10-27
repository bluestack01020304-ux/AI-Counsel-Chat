from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.api import auth
from src.backend.api import users
from src.backend.api import chat

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "null",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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
