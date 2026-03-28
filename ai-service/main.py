from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Document, User
from pydantic import BaseModel


app = FastAPI()
class DocumentCreate(BaseModel):
    userId: int
    filename: str
    status: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str

class UserLookup(BaseModel):
    email: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@app.post("/documents")
def create_document(doc: DocumentCreate, db: Session = Depends(get_db)):
    new_doc = Document(
        user_id=doc.userId,
        filename=doc.filename,
        status=doc.status,
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {"documentId": new_doc.id}

@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        email=user.email,
        password=user.password,  # already hashed by gateway
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

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"status": "DB connected successfully"}