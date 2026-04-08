from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Document, User, Chunk
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    query: str
    userId: int
    topK: int = 5
    sessionId: str = "default"

class RetrieveRequest(BaseModel):
    query: str
    userId: int
    topK: int = 5

class DocumentCreate(BaseModel):
    userId: int
    filePath: str
    filename: str
    status: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/documents")
def create_document(
    doc: DocumentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    new_doc = Document(
        user_id=doc.userId,
        filename=doc.filename,
        file_path=doc.filePath,
        status="pending",
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    background_tasks.add_task(process_document_task, new_doc.id)

    return {"documentId": new_doc.id}

@app.get("/documents/{document_id}/status")
def get_document_status(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "documentId": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "error": doc.error_message,
    }

@app.get("/documents/user/{user_id}")
def get_user_documents(user_id: int, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == user_id).all()
    return [
        {
            "documentId": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "error": doc.error_message,
            "createdAt": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in docs
    ]

@app.delete("/documents/{document_id}")
def delete_document(document_id: int, userId: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != userId:
        raise HTTPException(status_code=403, detail="Not authorised")
    db.query(Chunk).filter(Chunk.document_id == document_id).delete()
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}

@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    new_user = User(
        email=user.email,
        password=user.password,
        name=user.name,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"userId": new_user.id, "email": new_user.email, "role": new_user.role}

@app.get("/users/by-email")
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "userId": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "password": user.password,
    }

@app.post("/retrieve")
def retrieve(req: RetrieveRequest):
    from services.retriever import retrieve_chunks
    results = retrieve_chunks(
        query=req.query,
        user_id=req.userId,
        top_k=req.topK,
    )
    return {"results": results}

@app.post("/chat")
def chat(req: ChatRequest):
    from services.retriever import retrieve_chunks
    from services.llm import generate_answer
    from services.memory import get_history, add_turn

    history = get_history(req.sessionId)

    chunks = retrieve_chunks(
        query=req.query,
        user_id=req.userId,
        top_k=req.topK,
    )
    result = generate_answer(query=req.query, chunks=chunks, history=history)
    add_turn(req.sessionId, req.query, result["answer"])

    return result

@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    from services.retriever import retrieve_chunks
    from services.llm import stream_answer
    from services.memory import get_history, add_turn

    history = get_history(req.sessionId)

    chunks = retrieve_chunks(
        query=req.query,
        user_id=req.userId,
        top_k=req.topK,
    )

    def generate_and_remember():
        full_answer = ""
        for event_str in stream_answer(query=req.query, chunks=chunks, history=history):
            if '"type": "token"' in event_str:
                import json as _json
                try:
                    data = _json.loads(event_str.replace("data: ", "").strip())
                    if data.get("type") == "token":
                        full_answer += data.get("content", "")
                except Exception:
                    pass
            yield event_str

        add_turn(req.sessionId, req.query, full_answer)

    return StreamingResponse(
        generate_and_remember(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

@app.get("/chat/history")
def get_chat_history(sessionId: str = "default"):
    from services.memory import get_all_messages
    messages = get_all_messages(sessionId)
    return {"sessionId": sessionId, "messages": messages}

@app.post("/chat/clear")
def clear_chat_history(sessionId: str = "default"):
    from services.memory import clear_history
    clear_history(sessionId)
    return {"message": "History cleared", "sessionId": sessionId}

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"status": "DB connected successfully"}

def process_document_task(document_id: int):
    from services.processor import process_document
    process_document(document_id)