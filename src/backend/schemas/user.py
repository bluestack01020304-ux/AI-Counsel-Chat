from pydantic import BaseModel

class UserResponse(BaseModel):
    userid: int
    username: str
    role: str
