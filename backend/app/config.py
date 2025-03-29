from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb+srv://liyanasaleem0:Liya0711@bitebotcluster.dztbm.mongodb.net/")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "BiteBotDB")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings() 