from fastapi import APIRouter
from src.backend.schemas.chat import ChatRequest, ChatResponse, ChatRoomResponse
from src.backend.services.chat_service import ask, get_chatroom

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
def ask_endpoint(request: ChatRequest):

    return ask(request.question)

@router.get("/chatrooms/{session_id}", response_model=ChatRoomResponse)
def get_chatroom_endpoint(session_id: str):
    return get_chatroom(session_id)