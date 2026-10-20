
import jwt
import os

from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("TOKEN_SECRET_KEY")
ALGORITHM = "HS256"

security = HTTPBearer()

if not SECRET_KEY:
    raise RuntimeError("TOKEN_SECRET_KEY 환경변수가 설정되지 않았습니다.")


def create_access_token(data: dict):
    to_encode = data.copy()

    # 토큰 만료 시간: 30분
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode["exp"] = expire

    # datetime이 포함된 다른 데이터도 JSON 직렬화 가능하게 변환
    for key, value in to_encode.items():
        if isinstance(value, datetime):
            to_encode[key] = value.isoformat()

    # exp는 JWT 표준 NumericDate 형식으로 저장
    to_encode["exp"] = int(expire.timestamp())

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        userid = payload.get("userid")

        if userid is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="존재하지 않는 토큰입니다"
            )

        return payload

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다."
        )
