import uuid
from fastapi import HTTPException

from src.backend.rag.rag import get_context
from src.backend.database.connection import get_connection
from src.backend.services.ai_service import chat, summarize_memory

TITLE_MAX_LENGTH = 45  # conversations.title 컬럼 길이
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

def _get_owned_title(session_id: str, sno: int):
    rows = _query("select title from conversations where conversation_id=%s and sno=%s", (session_id, sno))

    if not rows:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다")

    return rows[0][0]

def _save_message(session_id: str, role: str, content: str):
    _query(
        "insert into chat (conversation_id, role, content, created_at) values (%s, %s, %s, now())",
        (session_id, role, content),
        commit=True
    )


def _get_history(session_id: str):
    rows = _query(
        "select role, content from chat where conversation_id=%s order by created_at desc, cno desc limit %s",
        (session_id, HISTORY_LIMIT)
    )

    return list(reversed(rows))

def get_memory(sno: int):
    rows = _query("select summary from student_memory where sno=%s", (sno,))

    return rows[0][0] if rows else ""

def update_memory(sno: int, question: str, answer: str):
    # 답변 후 백그라운드에서 실행되므로 실패해도 상담은 계속되게 함
    try:
        summary = summarize_memory(get_memory(sno), question, answer)

        _query(
            """insert into student_memory (sno, summary, updated_at) values (%s, %s, now())
               on duplicate key update summary=values(summary), updated_at=values(updated_at)""",
            (sno, summary),
            commit=True
        )
    except Exception as e:
        print("기억 갱신 실패:", e)


def ask(question: str, sno: int, session_id: str = None):
    history = []
    if session_id:
        _get_owned_title(session_id, sno)
        history = _get_history(session_id)

    context = get_context(question)

    #AI 질문
    try:
        answer = chat(question, context, get_memory(sno), history)
    except Exception as e:
        print("AI 응답 실패:", e)
        raise HTTPException(status_code=502, detail="AI 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.")

    if session_id:
        _save_message(session_id, "user", question)
        _save_message(session_id, "ai", answer)

    return {"answer": answer, "session_id": session_id}

def list_chatrooms(sno: int):
    # 최근 대화가 있는 방부터
    rows = _query(
        """select c.conversation_id, c.title
           from conversations c left join chat m on m.conversation_id = c.conversation_id
           where c.sno=%s
           group by c.conversation_id, c.title
           order by max(m.created_at) desc""",
        (sno,)
    )

    return [{"session_id": row[0], "title": row[1]} for row in rows]

def get_chatroom(session_id: str, sno: int):
    title = _get_owned_title(session_id, sno)

    rows = _query(
        "select role, content, created_at from chat where conversation_id=%s order by created_at asc, cno asc",
        (session_id,)
    )

    messages = [{"sender": row[0], "message": row[1], "created_at": row[2]} for row in rows]

    return {"session_id": session_id, "title": title, "messages": messages}

def create_chatroom(sno: int, title: str):
    session_id = str(uuid.uuid4())
    title = title.strip()[:TITLE_MAX_LENGTH] or "새 상담"

    _query(
        "insert into conversations (conversation_id, sno, title) values (%s, %s, %s)",
        (session_id, sno, title),
        commit=True
    )

    return {"session_id": session_id, "title": title, "messages": []}
