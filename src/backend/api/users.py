from fastapi import APIRouter, Depends
from src.backend.schemas.user import UserResponse, UserRequest
from src.backend.core.security import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_me(current_user = Depends(get_current_user)):
    return current_user