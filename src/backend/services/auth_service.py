from fastapi import HTTPException

from core.security import create_access_token
from database.connection import get_connection


def login(username: str, password: str):

    user = get_user(username, password)

    if not user:
        raise HTTPException(status_code=401, detail="아이디나 비밀번호가 일치하지 않습니다")
    
    access_token = create_access_token(data={"userid": user[0], "username": user[1], "role": user[3]})
    return {"access_token": access_token, "token_type": "bearer"}

def get_user(username: str, password: str):
    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))

        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()