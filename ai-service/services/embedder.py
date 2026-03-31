import os
from openai import OpenAI
from models import Chunk, Document
from database import SessionLocal

BATCH_SIZE = 100

COST_PER_TOKEN = 0.00000002


def generate_embeddings(document_id: int):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    db = SessionLocal()
    try:

        chunks = (
            db.query(Chunk)
            .filter(Chunk.document_id == document_id, Chunk.embedding == None)
            .all()
        )

        if not chunks:
            print(f"[Embedder] No chunks to embed for document {document_id}")
            _mark_ready(db, document_id)
            return

        print(f"[Embedder] Embedding {len(chunks)} chunks for document {document_id}")

        total_tokens = 0

        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]

            texts = [chunk.text for chunk in batch]

            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=texts,
            )


            for j, embedding_data in enumerate(response.data):
                batch[j].embedding = embedding_data.embedding

            total_tokens += response.usage.total_tokens

            db.commit()
            print(f"[Embedder] Batch {i // BATCH_SIZE + 1} done — {len(batch)} chunks embedded")

        estimated_cost = total_tokens * COST_PER_TOKEN
        print(
            f"[Embedder] Document {document_id} — "
            f"total tokens: {total_tokens}, "
            f"estimated cost: ${estimated_cost:.6f}"
        )

        _mark_ready(db, document_id)
        print(f"[Embedder] Document {document_id} status → ready")

    except Exception as e:
        print(f"[Embedder] Error embedding document {document_id}: {e}")
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = "failed"
                db.commit()
        except:
            pass

    finally:
        db.close()


def _mark_ready(db, document_id: int):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if doc:
        doc.status = "ready"
        db.commit()