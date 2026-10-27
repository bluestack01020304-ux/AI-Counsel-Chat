-- 채팅방이 달라도 이어지는 학생별 상담 기억(요약)
CREATE TABLE IF NOT EXISTS student_memory (
  sno INT NOT NULL,
  summary TEXT NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (sno)
);
