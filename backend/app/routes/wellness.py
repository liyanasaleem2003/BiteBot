from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_wellness_tips():
    return {"message": "Wellness endpoint works!"}
