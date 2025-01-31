from fastapi import FastAPI
from app.routes import profile, chatbot, recipes, auth
from fastapi.middleware.cors import CORSMiddleware
from app import wellness
from app.routes import auth
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (for images)
app.mount("/static/recipes", StaticFiles(directory="app/recipes"), name="static-recipes")

# Include routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(recipes.router, prefix="/recipes", tags=["Recipes"])

@app.get("/")
def read_root():
    return {"message": "Welcome to BiteBot Backend!"}
