import chromadb


client = chromadb.PersistentClient(
    path="./data/chroma"
)

collection = client.get_or_create_collection(
    name="career"
)

def add_documents(chunks, embeddings):

    collection.add(
        ids=[
            str(i)
            for i in range(len(chunks))
        ],

        documents=chunks,

        embeddings=embeddings
    )