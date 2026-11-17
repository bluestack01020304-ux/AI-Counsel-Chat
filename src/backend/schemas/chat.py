from typing import Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None  # 없으면 대화를 저장하지 않음

class ChatResponse(BaseModel):
    answer: str
    session_id: Optional[str] = None

class CreateChatRoomRequest(BaseModel):
    title: str = "새 상담"

class ChatRoomSummary(BaseModel):
    session_id: str
    title: str

class ChatRoomResponse(BaseModel):
    session_id: str
    title: str
    messages: list
