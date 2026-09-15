from fastapi import APIRouter
from schemas.chat import ChatRequest, ChatResponse
from services.chat_service import ask

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
def ask(request: ChatRequest):

    return ask(request.question)