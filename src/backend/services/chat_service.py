from src.backend.rag.rag import get_context


def ai_chat(question: str, context: str) -> str:
    print("chated")
    
def ask(question: str):

    context = get_context(question)

    #AI 질문
    answer = ai_chat(question, context)
    return {"answer": answer}