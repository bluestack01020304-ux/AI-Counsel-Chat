from .embedder import embed
from .vector_db import collection
# from .rag import ask_ollama


def get_context(question):

    # 1. 질문을 벡터로 변환
    query_embedding = embed([question])[0]

    # 2. 관련 문서 검색
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3
    )

    # 3. 검색된 문서 가져오기
    documents = results["documents"][0]

    # 4. 하나의 context로 합치기
    context = "\n\n".join(documents)

    # 5. Ollama에게 질문
    print(question)
    print(context)
    # answer = ask_ollama(
    #     question,
    #     context
    # )

    # return answer

    return context

ask("경찰관이 되고 싶어")