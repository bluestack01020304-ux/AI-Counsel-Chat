from fastapi import APIRouter
from schemas.auth import AuthRequest, AuthResponse
from services.auth_service import login

router = APIRouter()

@router.post("/login", response_model=AuthResponse)
def auth(request: AuthRequest):

    return login(request.username, request.password) #로직 연결만
    # return AuthResponse(access_token="dummy_token", token_type="bearer")