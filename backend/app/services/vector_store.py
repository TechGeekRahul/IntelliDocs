import chromadb
from chromadb.utils import embedding_functions


class VectorStore:
    def __init__(self, persist_dir: str) -> None:
        self._client = chromadb.PersistentClient(path=persist_dir)
        self._collection = self._client.get_or_create_collection(
            name="document_chunks",
            embedding_function=embedding_functions.DefaultEmbeddingFunction(),
        )

    def index_document(self, document_id: str, filename: str, chunks: list[str]) -> None:
        if not chunks:
            return

        ids = [f"{document_id}:{index}" for index in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "filename": filename,
                "chunk_index": index,
            }
            for index in range(len(chunks))
        ]
        self._collection.add(ids=ids, documents=chunks, metadatas=metadatas)

    def search(
        self,
        query: str,
        top_k: int = 5,
        document_id: str | None = None,
    ) -> list[dict]:
        where = {"document_id": document_id} if document_id else None
        results = self._collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where,
        )

        matches: list[dict] = []
        if not results["ids"] or not results["ids"][0]:
            return matches

        for index, chunk_id in enumerate(results["ids"][0]):
            metadata = results["metadatas"][0][index]
            content = results["documents"][0][index]
            distance = results["distances"][0][index]
            matches.append(
                {
                    "source": metadata["filename"],
                    "document_id": metadata["document_id"],
                    "chunk_index": metadata["chunk_index"],
                    "content": content,
                    "score": round(1 / (1 + distance), 4),
                }
            )

        return matches
