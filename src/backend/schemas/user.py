from pydantic import BaseModel

def ResponseModel(BaseModel):
    id: int
    username: str
    role: str