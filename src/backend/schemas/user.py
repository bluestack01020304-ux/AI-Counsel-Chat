from pydantic import BaseModel

class UserRequest(BaseModel): #받는 데이터 구조 타입 정의
    access_token: str

class UserResponse(BaseModel):
    username: str
    #추가 정보