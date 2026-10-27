from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

class ChatRoomResponse(BaseModel):
    session_id: str
    title: str
    messages: list