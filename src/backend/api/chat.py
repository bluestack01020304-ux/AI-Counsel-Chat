from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from src.backend.schemas.chat import ChatRequest, ChatResponse, ChatRoomResponse, ChatRoomSummary, CreateChatRoomRequest
from src.backend.services.chat_service import ask, get_chatroom, create_chatroom, list_chatrooms, update_memory
from src.backend.core.security import get_current_user

router = APIRouter()

def get_current_student(current_user = Depends(get_current_user)):
    # 채팅방은 conversations.sno 기준이라 학생 계정만 사용
    if current_user.get("role") != "students":
        raise HTTPException(status_code=403, detail="학생 계정만 이용할 수 있습니다")
    return current_user

@router.post("/ask", response_model=ChatResponse)
def ask_endpoint(request: ChatRequest, background_tasks: BackgroundTasks, current_user = Depends(get_current_student)):

    result = ask(request.question, current_user["userid"], request.session_id)

    # 응답을 먼저 보내고, 다른 채팅방에서도 이어지도록 학생 기억을 갱신
    background_tasks.add_task(update_memory, current_user["userid"], request.question, result["answer"])

    return result

@router.get("/chatrooms", response_model=list[ChatRoomSummary])
def list_chatrooms_endpoint(current_user = Depends(get_current_student)):
    return list_chatrooms(current_user["userid"])

@router.get("/chatrooms/{session_id}", response_model=ChatRoomResponse)
def get_chatroom_endpoint(session_id: str, current_user = Depends(get_current_student)):
    return get_chatroom(session_id, current_user["userid"])

@router.post("/chatrooms/createRoom", response_model=ChatRoomResponse)
def create_chatroom_endpoint(request: CreateChatRoomRequest, current_user = Depends(get_current_student)):
    return create_chatroom(current_user["userid"], request.title)
