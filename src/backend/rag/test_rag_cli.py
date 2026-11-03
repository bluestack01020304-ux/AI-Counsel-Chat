"""
RAG CLI 테스트

프로젝트 루트(AI-Counsel-Chat)에서 실행:
    python -m src.backend.rag.test_rag_cli
    python -m src.backend.rag.test_rag_cli -n 5          # 검색 문서 개수
    python -m src.backend.rag.test_rag_cli --no-answer   # 검색 결과만 확인 (Gemini 호출 X)
    python -m src.backend.rag.test_rag_cli --reindex     # docs 다시 인덱싱 후 시작

종료: exit / quit / q 또는 Ctrl+C
"""

import argparse

from .embedder import embed
from .vector_db import client, collection
from .index import index_documents
from ..services.ai_service import chat, init


def search(question, n_results):

    query_embedding = embed([question])[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    return list(zip(documents, metadatas, distances))


def print_docs(docs):

    print("\n" + "=" * 60)
    print(f"[검색된 문서] {len(docs)}개")
    print("=" * 60)

    for i, (document, metadata, distance) in enumerate(docs, 1):
        source = (metadata or {}).get("source", "알 수 없음")
        print(f"\n--- #{i} | source: {source} | distance: {distance:.4f} ---")
        print(document.strip())


def print_answer(answer):

    print("\n" + "=" * 60)
    print("[답변]")
    print("=" * 60)
    print(answer)
    print()


def reindex():

    global collection

    client.delete_collection(collection.name)
    collection = client.get_or_create_collection(name="career")

    # index.py 가 import 한 collection 도 새 것으로 교체
    from . import index
    index.collection = collection

    index_documents()


def main():

    parser = argparse.ArgumentParser(description="RAG CLI 테스트")
    parser.add_argument("-n", "--n-results", type=int, default=3, help="검색할 문서 개수 (기본 3)")
    parser.add_argument("--no-answer", action="store_true", help="Gemini 답변 없이 검색 결과만 출력")
    parser.add_argument("--reindex", action="store_true", help="docs 폴더를 다시 인덱싱")
    args = parser.parse_args()

    if args.reindex:
        reindex()
    elif collection.count() == 0:
        print("벡터 DB가 비어 있어 docs 폴더를 인덱싱합니다...")
        index_documents()

    print(f"저장된 chunk 수: {collection.count()}")

    if not args.no_answer:
        init()

    print("질문을 입력하세요. (종료: exit / quit / q)")

    while True:
        try:
            question = input("\n질문> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n종료합니다.")
            break

        if not question:
            continue

        if question.lower() in ("exit", "quit", "q"):
            print("종료합니다.")
            break

        docs = search(question, args.n_results)
        print_docs(docs)

        if args.no_answer:
            continue

        context = "\n\n".join(document for document, _, _ in docs)

        try:
            answer = chat(question, context)
        except Exception as e:
            print(f"\n[답변 생성 실패] {e}")
            continue

        print_answer(answer)


if __name__ == "__main__":
    main()
