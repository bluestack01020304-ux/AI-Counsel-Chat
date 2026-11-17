import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from psycopg import errors

from src.backend.database.connection import get_connection

TOPIC_MAX_LENGTH = 1000  # 상담 안건 최대 길이

TIMESLOT_COLUMNS = """t.id, t.teacher_id, te.name, t.start_at, t.end_at, t.counseling_type, t.note"""

RESERVATION_SELECT = """
    select r.id, r.timeslot_id, te.name, s.name, t.start_at, t.end_at,
           r.consult_type, r.topic, r.status, r.reject_reason
    from reservations r
    join timeslots t on t.id = r.timeslot_id
    join teachers te on te.id = t.teacher_id
    join students s on s.id = r.student_id
"""


def _query(sql: str, params: tuple = (), commit: bool = False):
    conn = get_connection()
    cursor = None

    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)

        # insert/update ... returning 도 결과를 돌려줌
        rows = cursor.fetchall() if cursor.description else None

        if commit:
            conn.commit()

        return rows

    except Exception:
        conn.rollback()
        raise

    finally:
        if cursor:
            cursor.close()
        conn.close()

def _check_uuid(value: str, detail: str):
    # uuid 형식이 아니면 DB에서 에러가 나므로 미리 걸러냄
    try:
        uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=404, detail=detail)

def _is_linked(tno: str, sno: str):
    rows = _query("select 1 from teacher_students where tno=%s and sno=%s", (tno, sno))
    return bool(rows)

def _timeslot_dict(row, status: str, student_name: str = None):
    return {
        "id": str(row[0]),
        "teacher_id": str(row[1]),
        "teacher_name": row[2],
        "start_at": row[3],
        "end_at": row[4],
        "counseling_type": row[5],
        "note": row[6],
        "status": status,
        "student_name": student_name,
    }

def _reservation_dict(row):
    return {
        "id": str(row[0]),
        "timeslot_id": str(row[1]),
        "teacher_name": row[2],
        "student_name": row[3],
        "start_at": row[4],
        "end_at": row[5],
        "consult_type": row[6],
        "topic": row[7],
        "status": row[8],
        "reject_reason": row[9],
    }

def _get_reservation(reservation_id: str):
    rows = _query(RESERVATION_SELECT + " where r.id=%s", (reservation_id,))
    return _reservation_dict(rows[0])


# ---------- 학생 ----------

def list_my_teachers(sno: str):
    rows = _query(
        """select te.id, te.name
           from teacher_students ts join teachers te on te.id = ts.tno
           where ts.sno=%s
           order by te.name""",
        (sno,)
    )

    return [{"id": str(row[0]), "name": row[1]} for row in rows]

def list_student_timeslots(sno: str, start: datetime, end: datetime):
    # teacher_students로 연결된 선생님의 슬롯만 보여줌
    rows = _query(
        f"""select {TIMESLOT_COLUMNS}, r.student_id
            from timeslots t
            join teachers te on te.id = t.teacher_id
            join teacher_students ts on ts.tno = t.teacher_id and ts.sno = %s
            left join reservations r on r.timeslot_id = t.id and r.status in ('pending', 'confirmed')
            where t.start_at >= %s and t.start_at < %s
            order by t.start_at""",
        (sno, start, end)
    )

    now = datetime.now(timezone.utc)
    result = []
    for row in rows:
        reserved_by = row[7]
        if reserved_by is not None:
            status = "mine" if str(reserved_by) == sno else "taken"
        elif row[3] <= now:
            status = "closed"
        else:
            status = "available"
        result.append(_timeslot_dict(row, status))

    return result

def create_reservation(sno: str, timeslot_id: str, consult_type: str, topic: str):
    _check_uuid(timeslot_id, "상담 시간을 찾을 수 없습니다")

    topic = topic.strip()[:TOPIC_MAX_LENGTH]
    if not topic:
        raise HTTPException(status_code=400, detail="상담 안건을 입력해 주세요")

    rows = _query("select teacher_id, start_at from timeslots where id=%s", (timeslot_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="상담 시간을 찾을 수 없습니다")

    teacher_id, start_at = rows[0]

    # 선생님과 연결된(teacher_students) 학생만 신청 가능
    if not _is_linked(str(teacher_id), sno):
        raise HTTPException(status_code=403, detail="담당 선생님의 상담만 신청할 수 있습니다")

    if start_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="이미 지난 상담 시간입니다")

    try:
        rows = _query(
            """insert into reservations (timeslot_id, student_id, consult_type, topic)
               values (%s, %s, %s, %s) returning id""",
            (timeslot_id, sno, consult_type, topic),
            commit=True
        )
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="이미 다른 학생이 신청한 시간입니다")

    return _get_reservation(str(rows[0][0]))

def list_student_reservations(sno: str):
    rows = _query(RESERVATION_SELECT + " where r.student_id=%s order by t.start_at desc", (sno,))
    return [_reservation_dict(row) for row in rows]

def cancel_reservation(sno: str, reservation_id: str):
    _check_uuid(reservation_id, "예약을 찾을 수 없습니다")

    rows = _query(
        """update reservations set status='cancelled', updated_at=now()
           where id=%s and student_id=%s and status in ('pending', 'confirmed')
           returning id""",
        (reservation_id, sno),
        commit=True
    )

    if not rows:
        raise HTTPException(status_code=404, detail="취소할 수 있는 예약이 없습니다")

    return _get_reservation(reservation_id)


# ---------- 선생님 ----------

def create_timeslot(tno: str, start_at: datetime, end_at: datetime, counseling_type: str, note: str = None):
    if start_at.tzinfo is None or end_at.tzinfo is None:
        raise HTTPException(status_code=400, detail="시간대 정보가 포함된 시간이 필요합니다")

    if end_at <= start_at:
        raise HTTPException(status_code=400, detail="종료 시간은 시작 시간보다 늦어야 합니다")

    if start_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="지난 시간에는 상담을 열 수 없습니다")

    overlap = _query(
        "select 1 from timeslots where teacher_id=%s and start_at < %s and end_at > %s",
        (tno, end_at, start_at)
    )
    if overlap:
        raise HTTPException(status_code=409, detail="이미 등록된 상담 시간과 겹칩니다")

    note = (note or "").strip() or None

    rows = _query(
        """insert into timeslots (teacher_id, start_at, end_at, counseling_type, note)
           values (%s, %s, %s, %s, %s) returning id""",
        (tno, start_at, end_at, counseling_type, note),
        commit=True
    )

    rows = _query(
        f"""select {TIMESLOT_COLUMNS}
            from timeslots t join teachers te on te.id = t.teacher_id
            where t.id=%s""",
        (rows[0][0],)
    )

    return _timeslot_dict(rows[0], "open")

def list_teacher_timeslots(tno: str, start: datetime, end: datetime):
    rows = _query(
        f"""select {TIMESLOT_COLUMNS}, r.status, s.name
            from timeslots t
            join teachers te on te.id = t.teacher_id
            left join reservations r on r.timeslot_id = t.id and r.status in ('pending', 'confirmed')
            left join students s on s.id = r.student_id
            where t.teacher_id=%s and t.start_at >= %s and t.start_at < %s
            order by t.start_at""",
        (tno, start, end)
    )

    return [_timeslot_dict(row, row[7] or "open", row[8]) for row in rows]

def list_teacher_reservations(tno: str):
    rows = _query(RESERVATION_SELECT + " where t.teacher_id=%s order by t.start_at desc", (tno,))
    return [_reservation_dict(row) for row in rows]

def _update_by_teacher(tno: str, reservation_id: str, status: str, reject_reason: str = None):
    _check_uuid(reservation_id, "예약을 찾을 수 없습니다")

    # 내 슬롯의 대기 중 예약만 처리, 승인은 지금도 teacher_students로 연결된 학생일 때만
    rows = _query(
        """update reservations r set status=%s, reject_reason=%s, updated_at=now()
           from timeslots t
           where r.id=%s and r.timeslot_id = t.id and t.teacher_id=%s and r.status='pending'
             and (%s <> 'confirmed'
                  or exists (select 1 from teacher_students ts where ts.tno = t.teacher_id and ts.sno = r.student_id))
           returning r.id""",
        (status, reject_reason, reservation_id, tno, status),
        commit=True
    )

    if not rows:
        raise HTTPException(status_code=404, detail="처리할 수 있는 대기 중 예약이 없습니다")

    return _get_reservation(reservation_id)

def approve_reservation(tno: str, reservation_id: str):
    return _update_by_teacher(tno, reservation_id, "confirmed")

def reject_reservation(tno: str, reservation_id: str, reason: str = None):
    reason = (reason or "").strip() or None
    return _update_by_teacher(tno, reservation_id, "rejected", reason)
