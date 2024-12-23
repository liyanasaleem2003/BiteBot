from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import users_collection
from bcrypt import hashpw, gensalt, checkpw

router = APIRouter()

class SignupRequest(BaseModel):
    email: str
    password: str
    age: int
    bmi: float
    height: float
    family_history: list
    dietary_preferences: list
    goals: list

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(user: SignupRequest):
    # Check if user already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="User already exists")
    # Hash password
    hashed_password = hashpw(user.password.encode(), gensalt())
    user_data = user.dict()
    user_data["password"] = hashed_password
    users_collection.insert_one(user_data)
    return {"message": "User created successfully"}

@router.post("/login")
def login(credentials: LoginRequest):
    user = users_collection.find_one({"email": credentials.email})
    if not user or not checkpw(credentials.password.encode(), user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"message": "Login successful", "email": credentials.email"}
