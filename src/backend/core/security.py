import jwt
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("TOKEN_SECRET_KEY")
ALGORITHM = "HS256"

security= HTTPBearer()

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        userid = payload.get("userid")

        if(userid is None):
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
