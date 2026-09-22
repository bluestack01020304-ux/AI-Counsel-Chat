from pathlib import Path

def load_documents(directory: str):
    documents = []

    for file in Path(directory).glob("*.txt"):
        text = file.read_text(encoding="utf-8")

        documents.append({
            "filename": file.name,
            "text": text
        })

    return documents

def split_text(text, chunk_size=500, overlap=50):
    chunks = []

    start = 0

    while start < len(text):
        end = start + chunk_size

        chunks.append(text[start:end])

        start += chunk_size - overlap

    return chunks