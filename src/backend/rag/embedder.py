from sentence_transformers import SentenceTransformer


model = SentenceTransformer(
    "jhgan/ko-sroberta-multitask"
)


def embed(texts):
    return model.encode(
        texts,
        normalize_embeddings=True
    ).tolist()