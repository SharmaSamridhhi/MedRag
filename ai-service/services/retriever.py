import os
import time
from openai import OpenAI
from sqlalchemy import text
from database import SessionLocal

def retrieve_chunks(query: str, user_id: int, top_k: int = 5):
    """
    Takes a user query and user_id, returns the top_k most similar
    chunks from documents owned by that user.
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    embed_response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    query_embedding = embed_response.data[0].embedding
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    db = SessionLocal()
    start_time = time.time()

    try:
        result = db.execute(
            text("""
                SELECT
                    c.id,
                    c.text,
                    c.page_number,
                    c.document_id,
                    1 - (c.embedding <=> CAST(:embedding AS vector)) AS similarity_score
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE d.user_id = :user_id
                  AND d.status = 'ready'
                ORDER BY c.embedding <=> CAST(:embedding AS vector)
                LIMIT :top_k
            """),
            {
                "embedding": embedding_str,
                "user_id": user_id,
                "top_k": top_k,
            }
        )

        rows = result.fetchall()

        elapsed_ms = (time.time() - start_time) * 1000
        print(f"[Retriever] Similarity search completed in {elapsed_ms:.1f}ms — {len(rows)} chunks returned")

        return [
            {
                "chunkId": row.id,
                "text": row.text,
                "pageNumber": row.page_number,
                "documentId": row.document_id,
                "similarityScore": round(float(row.similarity_score), 4),
            }
            for row in rows
        ]

    finally:
        db.close()