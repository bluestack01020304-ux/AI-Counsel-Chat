from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from src.backend.api import auth
from src.backend.api import users
from src.backend.api import chat
from src.backend.api import reservation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Live Server 등 로컬 개발 서버는 포트가 바뀔 수 있어 localhost 전체 포트 허용
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=["null"],  # html 파일을 직접 열었을 때(file://)
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

app.include_router(
    reservation.router,
    prefix="/api/reservations",
)

# 프론트엔드도 같은 서버에서 제공: http://127.0.0.1:8000/ 접속 시 로그인 화면
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/html/login.html")

app.mount("/", StaticFiles(directory=FRONTEND_DIR), name="frontend")
