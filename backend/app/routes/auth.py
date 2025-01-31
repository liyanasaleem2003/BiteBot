from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.routes.database import user_profiles
from werkzeug.security import generate_password_hash, check_password_hash

router = APIRouter()

class RegisterUser(BaseModel):
    first_name: str
    email: EmailStr
    password: str
    profile: dict  # Profile data from frontend (age, sex, height, etc.)

@router.post("/register", status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_user(user: RegisterUser):
    # Check if user already exists
    if user_profiles.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    # Hash the password
    hashed_password = generate_password_hash(user.password)
# Save user to database, including profile details
    user_profiles.insert_one({
        "first_name": user.first_name,
        "email": user.email,
        "password": hashed_password,
        "profile": {
            "age": user.profile.get("age", None),
            "sex": user.profile.get("sex", None),
            "height": user.profile.get("height", None),
            "weight": user.profile.get("weight", None),
            "activityLevel": user.profile.get("activityLevel", None),
            "healthGoal": user.profile.get("healthGoal", None),
        },
    })

    return {"message": "User registered successfully"}
# Login route
class Login(BaseModel):
    email: str
    password: str

@router.post("/login", tags=["Authentication"])
async def login_user(login: Login):
    user = user_profiles.find_one({"email": login.email})
    if not user or not check_password_hash(user["password"], login.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful"}
