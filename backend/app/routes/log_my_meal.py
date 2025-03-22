from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_meal_plan():
    return {"message": "Meal plan endpoint works!"}
