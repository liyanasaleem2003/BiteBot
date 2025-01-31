import json
from database import recipes  # Import the recipes collection from database.py
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def insert_recipes():
    try:
        # Verify if MONGO_URI is loaded correctly
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise ValueError("MONGO_URI is not defined. Check your .env file.")

        # Open and load the JSON file
        with open("updated_recipes.json", "r") as file:  # Adjust the path if needed
            recipes_data = json.load(file)

        # Insert recipes into the `recipes` collection
        if isinstance(recipes_data, list):  # Ensure the JSON file is a list of recipes
            result = recipes.insert_many(recipes_data)
            print(f"Inserted {len(result.inserted_ids)} recipes into the database.")
        else:
            print("JSON file format is incorrect. Expected a list of recipes.")
    except Exception as e:
        print(f"Error inserting recipes: {e}")

if __name__ == "__main__":
    insert_recipes()
