from fastapi import FastAPI
from app.routes import auth, profile, chatbot, meal_plan, wellness

app = FastAPI()

# Include routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(meal_plan.router, prefix="/meal-plan", tags=["Meal Plan"])
app.include_router(wellness.router, prefix="/wellness", tags=["Wellness"])

@app.get("/")
def read_root():
    return {"message": "Welcome to BiteBot Backend!"}
