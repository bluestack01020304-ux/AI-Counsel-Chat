from pydantic import BaseModel

class UserResponse(BaseModel):
    username: str
    #추가 정보