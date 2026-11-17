import uuid
from fastapi import HTTPException

from src.backend.rag.rag import get_context
from src.backend.database.connection import get_connection
from src.backend.services.ai_service import chat

TITLE_MAX_LENGTH = 45  # 채팅방 제목 최대 길이
HISTORY_LIMIT = 10  # AI에 함께 보내는 현재 채팅방의 최근 메시지 수


def _query(sql: str, params: tuple = (), commit: bool = False):
    conn = get_connection()
    cursor = None

    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)

        if commit:
            conn.commit()
            return None

        return cursor.fetchall()

    except Exception:
        conn.rollback()
        raise

    finally:
        if cursor:
            cursor.close()
        conn.close()

def _get_owned_title(session_id: str, sno: str):
    # uuid 형식이 아니면 DB에서 에러가 나므로 미리 걸러냄
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다")

    rows = _query("select title from conversations where id=%s and sno=%s", (session_id, sno))

    if not rows:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다")

    return rows[0][0]

def _save_message(session_id: str, role: str, content: str):
    _query(
        "insert into chat (cno, role, content) values (%s, %s, %s)",
        (session_id, role, content),
        commit=True
    )


def _get_history(session_id: str):
    rows = _query(
        "select role, content from chat where cno=%s order by created_at desc limit %s",
        (session_id, HISTORY_LIMIT)
    )

    return list(reversed(rows))

def ask(question: str, sno: str, session_id: str = None):
    history = []
    if session_id:
        _get_owned_title(session_id, sno)
        history = _get_history(session_id)

    context = get_context(question)

    #AI 질문
    try:
        answer = chat(question, context, history=history)
    except Exception as e:
        print("AI 응답 실패:", e)
        raise HTTPException(status_code=502, detail="AI 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.")

    if session_id:
        _save_message(session_id, "user", question)
        _save_message(session_id, "ai", answer)

    return {"answer": answer, "session_id": session_id}

def list_chatrooms(sno: str):
    # 최근 대화가 있는 방부터
    rows = _query(
        """select c.id, c.title
           from conversations c left join chat m on m.cno = c.id
           where c.sno=%s
           group by c.id, c.title
           order by max(m.created_at) desc nulls last""",
        (sno,)
    )

    return [{"session_id": str(row[0]), "title": row[1]} for row in rows]

def get_chatroom(session_id: str, sno: str):
    title = _get_owned_title(session_id, sno)

    rows = _query(
        "select role, content, created_at from chat where cno=%s order by created_at asc",
        (session_id,)
    )

    messages = [{"sender": row[0], "message": row[1], "created_at": row[2]} for row in rows]

    return {"session_id": session_id, "title": title, "messages": messages}

def create_chatroom(sno: str, title: str):
    session_id = str(uuid.uuid4())
    title = title.strip()[:TITLE_MAX_LENGTH] or "새 상담"

    _query(
        "insert into conversations (id, sno, title) values (%s, %s, %s)",
        (session_id, sno, title),
        commit=True
    )

    return {"session_id": session_id, "title": title, "messages": []}