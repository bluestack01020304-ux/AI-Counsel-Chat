-- 채팅방 id(UUID)와 AI 답변 길이에 맞게 chat 테이블 컬럼 변경
ALTER TABLE chat
  MODIFY conversation_id VARCHAR(36) NOT NULL,
  MODIFY content TEXT NOT NULL;
