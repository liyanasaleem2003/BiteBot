import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

async def test_connection():
    # Load environment variables
    load_dotenv()
    
    # Get MongoDB URI
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return
    
    print(f"Attempting to connect to MongoDB with URI: {mongo_uri}")
    
    try:
        # Create the client
        client = AsyncIOMotorClient(mongo_uri)
        
        # Test the connection
        await client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        # List databases
        databases = await client.list_database_names()
        print("\nAvailable databases:")
        for db in databases:
            print(f"- {db}")
        
        # Test specific database
        db = client["BiteBotDB"]
        collections = await db.list_collection_names()
        print("\nCollections in BiteBotDB:")
        for collection in collections:
            print(f"- {collection}")
            
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
    finally:
        # Close the connection
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection()) 