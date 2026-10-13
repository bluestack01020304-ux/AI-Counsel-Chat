from fastapi import APIRouter
from src.backend.schemas.chat import ChatRequest, ChatResponse
from src.backend.services.chat_service import ask

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
def ask(request: ChatRequest):

    return ask(request.question)