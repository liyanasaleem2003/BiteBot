from typing import Dict, Any
import openai
from ..config import settings
from ..models import UserProfile

class NutritionService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY

    async def calculate_nutritional_needs(self, user_profile: UserProfile) -> Dict[str, Any]:
        """
        Calculate nutritional needs using GPT-4 based on user profile
        """
        # Create a detailed prompt for GPT-4
        prompt = f"""
        Calculate daily nutritional needs for a person with the following profile:
        
        Basic Information:
        - Age: {user_profile.age}
        - Sex: {user_profile.sex}
        - Height: {user_profile.height.value} {user_profile.height.unit}
        - Weight: {user_profile.weight.value} {user_profile.weight.unit}
        - Activity Level: {user_profile.activity_level}
        
        Health Conditions:
        Personal Health History: {', '.join(user_profile.personal_health_history)}
        Family Health History: {', '.join(user_profile.family_health_history)}
        
        Dietary Preferences: {', '.join(user_profile.dietary_preferences)}
        Foods to Avoid: {', '.join(user_profile.foods_to_avoid)}
        
        Health Goals: {', '.join(user_profile.health_goals)}
        Priority Micronutrients: {', '.join(user_profile.priority_micronutrients)}
        
        Please provide a detailed nutritional plan in the following JSON format:
        {{
            "daily_calories": number,
            "macros": {{
                "protein": {{
                    "grams": number,
                    "percentage": number
                }},
                "carbs": {{
                    "grams": number,
                    "percentage": number
                }},
                "fats": {{
                    "grams": number,
                    "percentage": number
                }}
            }},
            "fiber": {{
                "grams": number
            }},
            "sugar": {{
                "grams": number,
                "percentage_of_carbs": number
            }},
            "sodium": {{
                "mg": number
            }},
            "micronutrient_targets": {{
                "nutrient_name": {{
                    "amount": number,
                    "unit": string
                }}
            }},
            "meal_timing": {{
                "meals_per_day": number,
                "suggested_times": [string],
                "portion_distribution": {{
                    "breakfast": number,
                    "lunch": number,
                    "dinner": number,
                    "snacks": number
                }}
            }},
            "recommendations": [string]
        }}
        """

        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a professional nutritionist specializing in South Asian cuisine and dietary needs. Provide accurate, personalized nutritional recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            # Parse the response and return the nutritional plan
            nutritional_plan = response.choices[0].message.content
            return nutritional_plan

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