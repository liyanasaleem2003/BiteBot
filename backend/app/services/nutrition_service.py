from typing import Dict, Any
import openai
from ..config import settings
from ..models import UserProfile
import json

class NutritionService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY

    async def calculate_nutritional_needs(self, profile_data: dict) -> dict:
        """Calculate personalized nutritional needs using GPT-4"""
        try:
            print("\n=== Starting Nutrition Service Calculation ===")
            print(f"Calculating needs for profile: {json.dumps(profile_data, indent=2)}")
            
            # Construct the prompt
            prompt = f"""Based on the following user profile, calculate personalized daily nutritional needs:

User Profile:
- Age: {profile_data.get('age', 'Not specified')}
- Gender: {profile_data.get('gender', 'Not specified')}
- Weight: {profile_data.get('weight', 'Not specified')} kg
- Height: {profile_data.get('height', 'Not specified')} cm
- Activity Level: {profile_data.get('activity_level', 'Not specified')}
- Health Conditions: {profile_data.get('health_conditions', 'None')}
- Dietary Preferences: {profile_data.get('dietary_preferences', 'None')}
- Fitness Goals: {profile_data.get('fitness_goals', 'Not specified')}

Please provide a JSON response with the following structure:
{{
    "calories": {{
        "min": <minimum daily calories>,
        "max": <maximum daily calories>
    }},
    "macros": {{
        "protein": {{"min": <min g>, "max": <max g>, "unit": "g"}},
        "carbs": {{"min": <min g>, "max": <max g>, "unit": "g"}},
        "fats": {{"min": <min g>, "max": <max g>, "unit": "g"}}
    }},
    "other_nutrients": {{
        "fiber": {{"min": <min g>, "max": <max g>, "unit": "g"}},
        "sugar": {{"min": <min g>, "max": <max g>, "unit": "g"}},
        "sodium": {{"min": <min mg>, "max": <max mg>, "unit": "mg"}}
    }}
}}"""

            print("Sending request to GPT-4o-mini-2024-07-18...")
            response = await openai.ChatCompletion.acreate(
                model="gpt-4o-mini-2024-07-18",
                messages=[
                    {"role": "system", "content": "You are a professional nutritionist providing personalized nutritional recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            print("Received response from GPT-4o-mini-2024-07-18")
            response_text = response.choices[0].message.content
            print(f"Raw GPT Response: {response_text}")
            
            nutritional_needs = json.loads(response_text)
            print(f"Parsed nutritional needs: {json.dumps(nutritional_needs, indent=2)}")
            
            return nutritional_needs

        except Exception as e:
            raise Exception(f"Error calculating nutritional needs: {str(e)}")

    async def analyze_meal_photo(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze a meal photo using GPT-4 Vision to extract nutritional information
        """
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this South Asian meal and provide nutritional information in the following JSON format: { 'food_items': [{ 'name': string, 'portion_size': string, 'estimated_calories': number, 'macros': { 'protein': number, 'carbs': number, 'fats': number }, 'fiber': number, 'sugar': number, 'sodium': number }], 'total_calories': number, 'total_macros': { 'protein': number, 'carbs': number, 'fats': number }, 'total_fiber': number, 'total_sugar': number, 'total_sodium': number, 'health_notes': [string] }"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )

            meal_analysis = response.choices[0].message.content
            return meal_analysis

        except Exception as e:
            raise Exception(f"Error analyzing meal photo: {str(e)}") 