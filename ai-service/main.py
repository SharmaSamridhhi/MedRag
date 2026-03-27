# from fastapi import FastAPI
# from pydantic import BaseModel
# from database import SessionLocal

# app = FastAPI()

# class Prompt(BaseModel):
#     message : str
    
# @app.get("/")
# def root():
#     return {"status": "AI service running"}    
    
# @app.post('/chat')
# async def chat(prompt :Prompt):
#     return {
#         'response': f"you said: {prompt.message}"
#     }

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