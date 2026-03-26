from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Prompt(BaseModel):
    message : str
    
@app.get("/")
def root():
    return {"status": "AI service running"}    
    
@app.post('/chat')
async def chat(prompt :Prompt):
    return {
        'response': f"you said: {prompt.message}"
    }