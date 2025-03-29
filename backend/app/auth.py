from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.routes.database import get_database
from .models import TokenData, User
from bson import ObjectId
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configurations
SECRET_KEY = "your-secret-key-here"  # Move this to environment variables in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_database)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        logger.info("Decoding JWT token...")
        if not token:
            logger.error("No token provided")
            raise credentials_exception
            
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
            
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                logger.error("No user_id found in token")
                raise credentials_exception
            token_data = TokenData(sub=user_id)
            logger.info(f"Token decoded successfully. User ID: {user_id}")
        except JWTError as e:
            logger.error(f"JWT Error: {str(e)}")
            raise credentials_exception
        
        try:
            # Get user from database using the ID from token
            logger.info(f"Fetching user from database with ID: {user_id}")
            user = await db.user_profiles.find_one({"_id": ObjectId(token_data.sub)})
            if user is None:
                logger.error(f"User not found with ID: {token_data.sub}")
                raise credentials_exception
                
            logger.info(f"Found user: {user}")
            
            # Convert ObjectId to string for JSON serialization
            user["id"] = str(user["_id"])
            del user["_id"]
            
            # Remove password from response
            user.pop("password", None)
            
            # Ensure datetime fields are properly handled
            try:
                logger.info("Processing datetime fields...")
                if "created_at" in user:
                    logger.info(f"Processing created_at: {user['created_at']}")
                    user["created_at"] = datetime.fromisoformat(user["created_at"].isoformat())
                if "updated_at" in user:
                    logger.info(f"Processing updated_at: {user['updated_at']}")
                    user["updated_at"] = datetime.fromisoformat(user["updated_at"].isoformat())
                if "last_login" in user and user["last_login"]:
                    logger.info(f"Processing last_login: {user['last_login']}")
                    user["last_login"] = datetime.fromisoformat(user["last_login"].isoformat())
            except Exception as e:
                logger.error(f"Error handling datetime fields: {str(e)}")
                logger.error(f"User data before datetime fix: {user}")
                # If datetime conversion fails, use current time as fallback
                user["created_at"] = datetime.utcnow()
                user["updated_at"] = datetime.utcnow()
                
            # Ensure height and weight are properly formatted
            try:
                logger.info("Processing profile data...")
                if "profile" in user:
                    profile = user["profile"]
                    logger.info(f"Profile data: {profile}")
                    if "height" in profile:
                        logger.info(f"Processing height: {profile['height']}")
                        profile["height"] = {
                            "value": float(profile["height"]["value"]),
                            "unit": str(profile["height"]["unit"])
                        }
                    if "weight" in profile:
                        logger.info(f"Processing weight: {profile['weight']}")
                        profile["weight"] = {
                            "value": float(profile["weight"]["value"]),
                            "unit": str(profile["weight"]["unit"])
                        }
                    logger.info(f"Processed profile data: {profile}")
            except Exception as e:
                logger.error(f"Error handling height/weight data: {str(e)}")
                logger.error(f"Profile data that caused error: {user.get('profile', {})}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error handling height/weight data: {str(e)}"
                )
            
            try:
                logger.info("Creating User model...")
                logger.info(f"Final user data: {user}")
                return User(**user)
            except Exception as e:
                logger.error(f"Error creating User model: {str(e)}")
                logger.error(f"User data: {user}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error creating user model: {str(e)}"
                )
                
        except Exception as e:
            logger.error(f"Error fetching user from database: {str(e)}")
            raise credentials_exception
            
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise credentials_exception 