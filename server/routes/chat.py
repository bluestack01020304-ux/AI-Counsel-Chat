from fastapi import APIRouter
from pydantic import BaseModel
from ...Config import BASE_URL

from services.ollama import OllamaService

router = APIRouter()

url = BASE_URL

ollama_service = OllamaService(
    url
)


class ChatRequest(BaseModel):
    prompt: str


@router.post("/chat")
def chat(request: ChatRequest):
    return {
        "response": ollama_service.chat(request.prompt)
    }