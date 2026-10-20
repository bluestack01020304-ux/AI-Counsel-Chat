import uuid
from src.backend.rag.rag import get_context
from src.backend.database.connection import get_connection

def ai_chat(question: str, context: str) -> str:
    print("chated")
    
def ask(question: str):

    context = get_context(question)

    #AI 질문
    answer = ai_chat(question, context)
    return {"answer": answer}

def get_chatroom(session_id: str):
    # session_id를 기반으로 채팅방의 메시지를 가져오는 로직을 구현
    # 예시로, 임시로 메시지 리스트를 반환

    messages = []

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("select * from chat where conversation_id=%s order by created_at asc", (session_id,))

        rows = cursor.fetchall()

        for row in rows:
            messages.append({
                "sender": row[3],
                "message": row[4],
                "created_at": row[5]
            })

        cursor.close()

    finally:
        conn.close()
    
    return {"messages": messages}

def create_chatroom(studentno: str, title: str = "New Chat Room"):
    sessionId = str(uuid.uuid4())

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("insert into conversations values (%s, %s, %s)", (sessionId, studentno, title))

        cursor.close()
    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()

    return {
        "session_id": sessionId,
        "title": title,
        "sno": studentno,
        "messages": []
    }