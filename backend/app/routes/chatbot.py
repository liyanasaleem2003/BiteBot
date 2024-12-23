from fastapi import APIRouter
from app.utils import query_gpt

router = APIRouter()

@router.post("/")
def chat_with_bot(message: str):
    response = query_gpt(message)
    return {"response": response}