from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel

ConsultType = Literal["offline", "online"]

class CreateTimeslotRequest(BaseModel):
    start_at: datetime
    end_at: datetime
    counseling_type: ConsultType = "offline"
    note: Optional[str] = None

class TimeslotResponse(BaseModel):
    id: str
    teacher_id: str
    teacher_name: str
    start_at: datetime
    end_at: datetime
    counseling_type: str
    note: Optional[str] = None
    # available: 신청 가능 / mine: 내 예약 / taken: 다른 학생 예약 / closed: 지난 시간
    # (선생님 화면) open: 신청 없음 / pending / confirmed
    status: str
    student_name: Optional[str] = None

class CreateReservationRequest(BaseModel):
    timeslot_id: str
    consult_type: ConsultType = "offline"
    topic: str

class RejectReservationRequest(BaseModel):
    reason: Optional[str] = None

class ReservationResponse(BaseModel):
    id: str
    timeslot_id: str
    teacher_name: str
    student_name: str
    start_at: datetime
    end_at: datetime
    consult_type: str
    topic: str
    status: str
    reject_reason: Optional[str] = None

class TeacherSummary(BaseModel):
    id: str
    name: str
