from fastapi import APIRouter
from src.backend.schemas.chat import ChatRequest, ChatResponse, ChatRoomResponse
from src.backend.services.chat_service import ask, get_chatroom, create_chatroom

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
def ask_endpoint(request: ChatRequest):

    return ask(request.question)

@router.get("/chatrooms/{session_id}", response_model=ChatRoomResponse)
def get_chatroom_endpoint(session_id: str):
    return get_chatroom(session_id)

@router.post("/chatrooms/createRoom", response_model=ChatRoomResponse)
def create_chatroom_endpoint(sno: str, title: str):
    # 채팅방 생성 로직을 구현
    # 예시로, 임시로 메시지 리스트를 반환
    chatroom = create_chatroom(sno, title)
    return chatroom