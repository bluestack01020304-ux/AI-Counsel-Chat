-- 선생님이 오픈한 상담 가능 시간
CREATE TABLE IF NOT EXISTS timeslots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  counseling_type VARCHAR(10) NOT NULL DEFAULT 'offline'
                  CHECK (counseling_type IN ('offline', 'online')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX IF NOT EXISTS idx_timeslots_teacher_start ON timeslots (teacher_id, start_at);

-- 학생의 예약 신청 (상태: 대기/확정/반려/취소)
CREATE TABLE IF NOT EXISTS reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeslot_id   UUID NOT NULL REFERENCES timeslots(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  consult_type  VARCHAR(10) NOT NULL CHECK (consult_type IN ('offline', 'online')),
  topic         TEXT NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  reject_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 한 슬롯에는 대기/확정 예약이 하나만 (동시 신청 시 두 번째는 UniqueViolation)
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservation_active_slot
  ON reservations (timeslot_id)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_reservations_student ON reservations (student_id);
