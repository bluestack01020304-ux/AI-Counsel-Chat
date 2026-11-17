from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from src.backend.schemas.reservation import (
    CreateReservationRequest, CreateTimeslotRequest, RejectReservationRequest,
    ReservationResponse, TeacherSummary, TimeslotResponse,
)
from src.backend.services import reservation_service as service
from src.backend.core.security import get_current_user

router = APIRouter()

def get_current_student(current_user = Depends(get_current_user)):
    if current_user.get("role") != "students":
        raise HTTPException(status_code=403, detail="학생 계정만 이용할 수 있습니다")
    return current_user

def get_current_teacher(current_user = Depends(get_current_user)):
    if current_user.get("role") != "teachers":
        raise HTTPException(status_code=403, detail="선생님 계정만 이용할 수 있습니다")
    return current_user

# ---------- 공통 (역할에 따라 다른 목록) ----------

@router.get("/timeslots", response_model=list[TimeslotResponse])
def list_timeslots_endpoint(start: datetime, end: datetime, current_user = Depends(get_current_user)):
    if current_user.get("role") == "teachers":
        return service.list_teacher_timeslots(current_user["userid"], start, end)
    return service.list_student_timeslots(current_user["userid"], start, end)

@router.get("", response_model=list[ReservationResponse])
def list_reservations_endpoint(current_user = Depends(get_current_user)):
    if current_user.get("role") == "teachers":
        return service.list_teacher_reservations(current_user["userid"])
    return service.list_student_reservations(current_user["userid"])

# ---------- 학생 ----------

@router.get("/teachers", response_model=list[TeacherSummary])
def list_my_teachers_endpoint(current_user = Depends(get_current_student)):
    return service.list_my_teachers(current_user["userid"])

@router.post("", response_model=ReservationResponse)
def create_reservation_endpoint(request: CreateReservationRequest, current_user = Depends(get_current_student)):
    return service.create_reservation(current_user["userid"], request.timeslot_id, request.consult_type, request.topic)

@router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
def cancel_reservation_endpoint(reservation_id: str, current_user = Depends(get_current_student)):
    return service.cancel_reservation(current_user["userid"], reservation_id)

# ---------- 선생님 ----------

@router.post("/timeslots", response_model=TimeslotResponse)
def create_timeslot_endpoint(request: CreateTimeslotRequest, current_user = Depends(get_current_teacher)):
    return service.create_timeslot(
        current_user["userid"], request.start_at, request.end_at, request.counseling_type, request.note
    )

@router.post("/{reservation_id}/approve", response_model=ReservationResponse)
def approve_reservation_endpoint(reservation_id: str, current_user = Depends(get_current_teacher)):
    return service.approve_reservation(current_user["userid"], reservation_id)

@router.post("/{reservation_id}/reject", response_model=ReservationResponse)
def reject_reservation_endpoint(reservation_id: str, request: RejectReservationRequest, current_user = Depends(get_current_teacher)):
    return service.reject_reservation(current_user["userid"], reservation_id, request.reason)
