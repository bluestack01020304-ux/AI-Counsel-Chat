from fastapi import APIRouter
from src.backend.schemas.auth import AuthRequest, AuthResponse
from src.backend.services.auth_service import login

router = APIRouter()

@router.post("/login", response_model=AuthResponse)
def auth(request: AuthRequest):

    return login(request.username, request.password, request.roll) #로직 연결만
    # return AuthResponse(access_token="dummy_token", token_type="bearer")