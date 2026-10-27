from fastapi import HTTPException

from src.backend.core.security import create_access_token
from src.backend.database.connection import get_connection

# 로그인 가능한 계정 테이블
ROLES = {"students", "teachers"}


def login(username: str, password: str, roll: str = "students"):

    user = get_user(username, password, roll)

    if not user:
        raise HTTPException(status_code=401, detail="아이디나 비밀번호가 일치하지 않습니다")

    access_token = create_access_token(data={"userid": str(user[0]), "username": user[1], "role": roll})
    return {"access_token": access_token, "token_type": "bearer"}

def get_user(username: str, password: str, roll: str):
    ### roll: students or teachers만 사용
    if roll not in ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    conn = get_connection()
    cursor = None

    try:
        cursor = conn.cursor()

        cursor.execute(f"SELECT id, username FROM {roll} WHERE username = %s AND password = %s", (username, password))

        return cursor.fetchone()

    finally:
        if cursor:
            cursor.close()
        conn.close()
