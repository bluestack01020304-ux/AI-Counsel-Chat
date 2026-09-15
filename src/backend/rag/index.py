from .document_loader import load_documents, split_text
from .embedder import embed
from .vector_db import collection


def index_documents():

    documents = load_documents("docs")

    chunks = []
    metadatas = []
    ids = []

    chunk_id = 0

    for document in documents:

        document_chunks = split_text(
            document["text"],
            chunk_size=500,
            overlap=50
        )

        for chunk in document_chunks:

            chunks.append(chunk)

            metadatas.append({
                "source": document["filename"]
            })

            ids.append(
                f"{document['filename']}_{chunk_id}"
            )

            chunk_id += 1

    # embedding 생성
    embeddings = embed(chunks)

    # ChromaDB 저장
    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    print(f"{len(chunks)}개의 chunk를 저장했습니다.")


if __name__ == "__main__":
    index_documents()