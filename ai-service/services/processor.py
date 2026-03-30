import fitz
import tempfile
import os
import boto3
from langchain_text_splitters import RecursiveCharacterTextSplitter
from models import Document, Chunk
from database import SessionLocal


def download_from_s3(s3_uri: str) -> str:
    without_prefix = s3_uri[len("s3://"):]
    bucket, key = without_prefix.split("/", 1)

    s3 = boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )

    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    s3.download_fileobj(bucket, key, tmp)
    tmp.close()

    return tmp.name

def process_document(document_id: int):
    db = SessionLocal()
    tmp_path = None

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            print(f"[Processor] Document {document_id} not found")
            return

        doc.status = "processing"
        db.commit()

        file_path = doc.file_path

        if file_path.startswith("s3://"):
            print(f"[Processor] Downloading from S3: {file_path}")
            tmp_path = download_from_s3(file_path)
            local_path = tmp_path
        else:
            local_path = file_path

        pdf = fitz.open(local_path)

        all_chunks = []

        for page_number in range(len(pdf)):
            page = pdf[page_number]
            text = page.get_text()

            if not text or not text.strip():
                print(f"[Processor] Page {page_number + 1} has no extractable text. Skipping.")
                continue

            all_chunks.append({
                "text": text,
                "page_number": page_number + 1,
            })

        pdf.close()

        if not all_chunks:
            print(f"[Processor] No text extracted from document {document_id}")
            doc.status = "failed"
            db.commit()
            return

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=512,
            chunk_overlap=64,
            length_function=len,
        )

        chunk_index = 0

        for page_data in all_chunks:
            splits = splitter.split_text(page_data["text"])

            for split_text in splits:
                chunk = Chunk(
                    document_id=document_id,
                    text=split_text,
                    page_number=page_data["page_number"],
                    chunk_index=chunk_index,
                )
                db.add(chunk)
                chunk_index += 1

        doc.status = "processed"
        db.commit()

        print(f"[Processor] Document {document_id} processed. Total chunks: {chunk_index}")

    except Exception as e:
        print(f"[Processor] Error processing document {document_id}: {e}")
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = "failed"
                db.commit()
        except:
            pass

    finally:
        db.close()
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
            print(f"[Processor] Cleaned up temp file: {tmp_path}")