from ..rag.rag import get_context

def ask(question: str) -> str:

    context = get_context(question)

    #AI 질문
    answer = context
    return {"answer": answer}
    
    print("Questioned")