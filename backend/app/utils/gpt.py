import openai
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")
else:
    print("OpenAI API key loaded successfully")
    openai.api_key = api_key

def query_gpt(message: str):
    try:
        print("\n=== Starting GPT Query ===")
        print("Sending request to GPT-4...")
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": message}],
        )
        print("Received response from GPT-4")
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in GPT query: {str(e)}")
        raise e

async def calculate_nutritional_needs(profile_data):
    """
    Calculate personalized nutritional needs using GPT-4.
    """
    try:
        # Construct the prompt for GPT-4
        prompt = f"""As a professional nutritionist, calculate personalized daily nutritional targets for the following individual:

Personal Information:
- Age: {profile_data['age']} years
- Sex: {profile_data['sex']}
- Height: {profile_data['height']['value']} {profile_data['height']['unit']}
- Weight: {profile_data['weight']['value']} {profile_data['weight']['unit']}
- Activity Level: {profile_data['activity_level']}

Health Profile:
- Personal Health History: {', '.join(profile_data['personal_health_history'])}
- Family Health History: {', '.join(profile_data['family_health_history'])}
- Priority Micronutrients: {', '.join(profile_data['priority_micronutrients'])}
- Dietary Preferences: {', '.join(profile_data['dietary_preferences'])}
- Health Goals: {', '.join(profile_data['health_goals'])}

Please calculate personalized daily nutritional targets based on the individual's age group and developmental stage:

For Adolescents (13-17):
- Higher caloric needs for growth and development
- Increased protein for muscle development
- Balanced macronutrient distribution
- Focus on calcium, iron, and other growth-related nutrients

For Young Adults (18-25):
- Peak metabolic rate
- Balanced macronutrient distribution
- Focus on nutrient density
- Support for physical activity and recovery

For Adults (26+):
- Age-appropriate caloric needs
- Balanced macronutrient distribution
- Focus on maintaining health and preventing chronic disease
- Support for physical activity and recovery

Please provide the nutritional targets in the following JSON format:
{{
    "calories": {{
        "min": <integer>,
        "max": <integer>
    }},
    "macros": {{
        "protein": {{
            "min": <integer>,
            "max": <integer>,
            "unit": "g"
        }},
        "carbs": {{
            "min": <integer>,
            "max": <integer>,
            "unit": "g"
        }},
        "fats": {{
            "min": <integer>,
            "max": <integer>,
            "unit": "g"
        }}
    }},
    "other_nutrients": {{
        "fiber": {{
            "min": <integer>,
            "max": <integer>,
            "unit": "g"
        }},
        "sugar": {{
            "min": <integer>,
            "max": <integer>,
            "unit": "g"
        }},
        "sodium": {{
            "min": <integer>,
            "max": <integer>,
            "unit": "mg"
        }}
    }}
}}

Ensure all values are based on scientific research and dietary guidelines for the individual's age group and health profile."""

        print("\n=== Starting GPT Query ===")
        print("Sending request to GPT-4...")
        
        # Get response from GPT-4
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional nutritionist providing personalized nutritional recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        print("Received response from GPT-4")
        
        # Extract the response text
        response_text = response.choices[0].message.content
        print(f"GPT Response: {response_text}")
        
        # Parse the JSON response
        try:
            nutritional_needs = json.loads(response_text)
            
            # Validate the response structure
            required_fields = ["calories", "macros", "other_nutrients"]
            required_macros = ["protein", "carbs", "fats"]
            required_nutrients = ["fiber", "sugar", "sodium"]
            
            for field in required_fields:
                if field not in nutritional_needs:
                    raise ValueError(f"Missing required field: {field}")
            
            for macro in required_macros:
                if macro not in nutritional_needs["macros"]:
                    raise ValueError(f"Missing required macro: {macro}")
            
            for nutrient in required_nutrients:
                if nutrient not in nutritional_needs["other_nutrients"]:
                    raise ValueError(f"Missing required nutrient: {nutrient}")
            
            # Ensure all numeric values are integers
            nutritional_needs["calories"]["min"] = int(nutritional_needs["calories"]["min"])
            nutritional_needs["calories"]["max"] = int(nutritional_needs["calories"]["max"])
            
            for macro in required_macros:
                nutritional_needs["macros"][macro]["min"] = int(nutritional_needs["macros"][macro]["min"])
                nutritional_needs["macros"][macro]["max"] = int(nutritional_needs["macros"][macro]["max"])
            
            for nutrient in required_nutrients:
                nutritional_needs["other_nutrients"][nutrient]["min"] = int(nutritional_needs["other_nutrients"][nutrient]["min"])
                nutritional_needs["other_nutrients"][nutrient]["max"] = int(nutritional_needs["other_nutrients"][nutrient]["max"])
            
            return nutritional_needs
            
        except json.JSONDecodeError as e:
            print(f"Error parsing GPT response as JSON: {str(e)}")
            print(f"Raw response: {response_text}")
            raise ValueError("Failed to parse nutritional needs from GPT response")
            
    except Exception as e:
        print(f"Error calculating nutritional needs: {str(e)}")
        raise 