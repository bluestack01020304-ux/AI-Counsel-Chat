from pydantic import BaseModel

class AuthRequest(BaseModel): #받는 데이터 구조 타입 정의
    username: str
    password: str
    roll: str = "students" # Default role is "students"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str