from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"status": "DB connected successfully"}