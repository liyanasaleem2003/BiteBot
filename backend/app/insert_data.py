from database import user_profiles, recipes

# Insert sample user profile
user_profile = {
    "_id": "user001",
    "name": "Amit",
    "email": "amit@example.com",
    "password": "hashed_password",
    "age": 45,
    "gender": "Male",
    "height_cm": 175,
    "weight_kg": 75,
    "bmi": round(75 / (1.75 * 1.75), 2),
    "family_history": ["Diabetes", "High Cholestrol"],
    "saved_recipes": []
}
user_profiles.insert_one(user_profile)

# Insert sample recipe
recipe = {
    "_id": "recipe001",
    "name": "Chicken Tikka Salad",
    "image_url": "https://example.com/tikka-salad.jpg",
    "cuisine": "Indian",
    "tags": {
        "dietary": ["High-Protein", "Gluten-Free"],
        "health": ["Heart-Healthy", "Low-Fat"],
        "meal_type": "Lunch"
    },
    "ingredients": ["Chicken breast", "Yogurt", "Mixed greens", "Spices"],
    "instructions": "Step-by-step instructions here...",
    "price_per_portion_gbp": 3.50
}
recipes.insert_one(recipe)
