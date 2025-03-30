import openai
import os
import json
from dotenv import load_dotenv
import base64
from typing import Dict, Any, List
import httpx
from app.config import settings

# Load environment variables
load_dotenv()

# Get API key
api_key = settings.OPENAI_API_KEY
if not api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")
else:
    print("OpenAI API key loaded successfully")
    print(f"API Key prefix: {api_key[:10]}...")  # Only print first 10 chars for security
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
        print("\n=== GPT-MINI GENERATING NUTRITIONAL NEEDS ===")
        print(f"Profile data received: {json.dumps(profile_data, default=str)}")
        
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

        print("\n=== SENDING REQUEST TO GPT-MINI ===")
        print(f"Using model: gpt-4o-mini-2024-07-18")
        print(f"Temperature: 0.7")
        print(f"Max tokens: 1000")
        
        # Get response from GPT-4
        response = openai.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {"role": "system", "content": "You are a professional nutritionist providing personalized nutritional recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        print("\n=== RECEIVED RESPONSE FROM GPT-MINI ===")
        
        # Extract the response text
        response_text = response.choices[0].message.content
        print(f"Raw GPT Response: {response_text}")
        
        # Parse the JSON response
        try:
            # Clean up the response by removing markdown code block markers and any text before the JSON
            content = response_text.strip()
            if "```json" in content:
                content = content.split("```json")[1]
            if "```" in content:
                content = content.split("```")[0]
            content = content.strip()
            
            # Look for JSON-like structure between curly braces
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                nutritional_needs = json.loads(json_str)
            else:
                raise ValueError("No JSON structure found in response")
                
            print("\n=== PARSED NUTRITIONAL NEEDS ===")
            print(f"Successfully parsed nutritional needs: {json.dumps(nutritional_needs, indent=2)}")
            
            # Validate the response structure
            required_fields = ["calories", "macros", "other_nutrients"]
            required_macros = ["protein", "carbs", "fats"]
            required_nutrients = ["fiber", "sugar", "sodium"]
            
            print("\n=== VALIDATING RESPONSE STRUCTURE ===")
            for field in required_fields:
                if field not in nutritional_needs:
                    raise ValueError(f"Missing required field: {field}")
                print(f"✓ Found required field: {field}")
            
            for macro in required_macros:
                if macro not in nutritional_needs["macros"]:
                    raise ValueError(f"Missing required macro: {macro}")
                print(f"✓ Found required macro: {macro}")
            
            for nutrient in required_nutrients:
                if nutrient not in nutritional_needs["other_nutrients"]:
                    raise ValueError(f"Missing required nutrient: {nutrient}")
                print(f"✓ Found required nutrient: {nutrient}")
            
            # Ensure all numeric values are integers
            print("\n=== CONVERTING VALUES TO INTEGERS ===")
            nutritional_needs["calories"]["min"] = int(nutritional_needs["calories"]["min"])
            nutritional_needs["calories"]["max"] = int(nutritional_needs["calories"]["max"])
            print(f"✓ Converted calories to integers")
            
            for macro in required_macros:
                nutritional_needs["macros"][macro]["min"] = int(nutritional_needs["macros"][macro]["min"])
                nutritional_needs["macros"][macro]["max"] = int(nutritional_needs["macros"][macro]["max"])
                print(f"✓ Converted {macro} to integers")
            
            for nutrient in required_nutrients:
                nutritional_needs["other_nutrients"][nutrient]["min"] = int(nutritional_needs["other_nutrients"][nutrient]["min"])
                nutritional_needs["other_nutrients"][nutrient]["max"] = int(nutritional_needs["other_nutrients"][nutrient]["max"])
                print(f"✓ Converted {nutrient} to integers")
            
            print("\n=== GPT-MINI GENERATION COMPLETE ===")
            print(f"Final nutritional needs: {json.dumps(nutritional_needs, indent=2)}")
            return nutritional_needs
            
        except json.JSONDecodeError as e:
            print(f"\n❌ Error parsing GPT response as JSON: {str(e)}")
            print(f"Raw response: {response_text}")
            raise ValueError("Failed to parse nutritional needs from GPT response")
            
    except Exception as e:
        print(f"\n❌ Error calculating nutritional needs: {str(e)}")
        raise

async def analyze_meal_image(image_content: bytes) -> Dict[str, Any]:
    """
    Analyze a meal image using ChatGPT-4o Vision API.
    First detects ingredients, then engages in dialogue for more details.
    """
    try:
        print("\n=== Starting Image Analysis ===")
        print(f"Image content size: {len(image_content)} bytes")
        
        # Convert image to base64
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        print("Image converted to base64 successfully")
        
        # First prompt: Detect ingredients
        initial_prompt = """
        Look at this meal image and list all visible ingredients. Focus on:
        1. Main ingredients
        2. Vegetables
        3. Proteins
        4. Grains
        5. Any visible spices or herbs
        
        Return ONLY a JSON object with the following structure (no markdown formatting):
        {
            "detected_ingredients": ["ingredient1", "ingredient2", ...],
            "confidence_level": "high/medium/low",
            "clarifying_questions": [
                {
                    "category": "preparation",
                    "question": "How was this meal prepared? Please specify:",
                    "sub_questions": [
                        "What cooking method was used? (e.g., boiled, fried, roasted, etc.)",
                        "What type and amount of oil/fat was used? (e.g., 1 tbsp olive oil, 2 tsp butter, etc.)",
                        "What is the serving size? (e.g., 1 cup, 2 pieces, 100g, etc.)"
                    ]
                }
            ]
        }

        Important:
        1. Only ask follow-up questions about preparation method, oil/fat used, and serving size
        2. Keep the conversation focused and limit to 3-4 total questions
        3. If the user provides a vague answer (e.g., just saying "potato" or "oil"), ask them to be more specific about:
           - For ingredients: the type/variety (e.g., russet potato, sweet potato)
           - For oils: the type and amount (e.g., 1 tbsp olive oil, 2 tsp butter)
           - For serving sizes: the specific amount (e.g., 1 cup, 100g)
        """
        
        # Prepare the API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "chatgpt-4o-latest",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": initial_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 16384
        }
        
        print("\n=== Starting GPT Vision Query ===")
        print("Sending request to ChatGPT-4o...")
        print(f"API Key present: {'Yes' if api_key else 'No'}")
        print(f"API Key prefix in headers: {api_key[:10]}...")  # Only print first 10 chars for security
        print(f"Request URL: https://api.openai.com/v1/chat/completions")
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                print(f"Response status code: {response.status_code}")
                print(f"Response headers: {response.headers}")
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"GPT API error: {error_text}")
                    raise Exception(f"GPT API error: {error_text}")
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                print(f"Received response from ChatGPT-4o: {content}")
                
                # Clean up the response by removing markdown code block markers
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                # Parse the JSON response
                try:
                    initial_analysis = json.loads(content)
                    print("Successfully parsed JSON response")
                    return initial_analysis
                except json.JSONDecodeError as e:
                    print(f"Error parsing GPT response as JSON: {str(e)}")
                    print(f"Raw response: {content}")
                    raise Exception(f"Failed to parse GPT response as JSON: {str(e)}")
                    
            except httpx.RequestError as e:
                print(f"HTTP request error: {str(e)}")
                print(f"Request details: URL=https://api.openai.com/v1/chat/completions, Headers={headers}")
                raise Exception(f"HTTP request failed: {str(e)}")
                
    except Exception as e:
        print(f"Error in analyze_meal_image: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {str(e)}")
        raise Exception(f"Failed to analyze meal image: {str(e)}")

async def analyze_meal_details(conversation_history: List[Dict[str, str]], user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze meal details based on conversation history and user profile.
    """
    try:
        # Construct a prompt that includes conversation history and user profile
        prompt = f"""
        Based on the following conversation about a meal and the user's profile, provide a detailed nutritional analysis.
        Make sure to provide specific numerical values for all nutritional information.

        User Profile:
        - Age: {user_profile.get('age')}
        - Sex: {user_profile.get('sex')}
        - Health Goals: {', '.join(user_profile.get('health_goals', []))}
        - Dietary Preferences: {', '.join(user_profile.get('dietary_preferences', []))}
        - Health Conditions: {', '.join(user_profile.get('personal_health_history', []))}

        Conversation History:
        {json.dumps(conversation_history, indent=2)}

        Please provide a comprehensive analysis in the following JSON format with specific numerical values:
        {{
            "meal_name": "A descriptive name that includes the main ingredients and cooking style. For example:
                         - If it's a dal with rice: 'Dal Rice with Vegetables'
                         - If it's a curry: 'Mixed Vegetable Curry with Dal'
                         - If it's a soup: 'Lentil Vegetable Soup'
                         The name should reflect the actual ingredients detected and cooking method used.",
            "ingredients": ["ingredient1", "ingredient2", ...],
            "cooking_method": "method",
            "serving_size": "size",
            "calories": number,  # Must be a specific number
            "protein": number,   # Must be a specific number in grams
            "carbs": number,     # Must be a specific number in grams
            "fats": number,      # Must be a specific number in grams
            "fiber": number,     # Must be a specific number in grams
            "sugar": number,     # Must be a specific number in grams
            "sodium": number,    # Must be a specific number in milligrams
            "health_tags": ["tag1", "tag2", ...],
            "suggestions": ["suggestion1", "suggestion2", ...],
            "recommended_recipes": ["recipe1", "recipe2", ...],
            "macronutrient_split": {{
                "protein_percentage": number,  # Must be a specific percentage
                "carbs_percentage": number,    # Must be a specific percentage
                "fats_percentage": number      # Must be a specific percentage
            }}
        }}

        The meal name should:
        1. Include the main ingredients detected
        2. Reflect the cooking method used
        3. Be specific to the actual dish (not generic)
        4. Follow common naming conventions for the cuisine
        5. Be 3-5 words long
        """
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "chatgpt-4o-latest",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional nutritionist specializing in South Asian cuisine and dietary needs. Provide accurate nutritional analysis based on the conversation and user profile. Always provide specific numerical values for all nutritional information."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 16384
        }
        
        print("\n=== Starting GPT Analysis Query ===")
        print("Sending request to ChatGPT-4o...")
        print(f"API Key present: {'Yes' if api_key else 'No'}")
        print(f"Request URL: https://api.openai.com/v1/chat/completions")
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                print(f"Response status code: {response.status_code}")
                print(f"Response headers: {response.headers}")
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"GPT API error: {error_text}")
                    raise Exception(f"GPT API error: {error_text}")
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                print(f"Received response from ChatGPT-4o: {content}")
                
                # Clean up the response by removing markdown code block markers
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                # Parse the JSON response
                try:
                    # First attempt: direct parsing
                    analysis = json.loads(content)
                except json.JSONDecodeError as e:
                    print(f"Initial JSON parsing failed: {str(e)}")
                    print(f"Raw response: {content}")
                    
                    # Second attempt: fix common JSON formatting issues
                    try:
                        # Replace single quotes with double quotes
                        content = content.replace("'", '"')
                        # Fix unquoted property names
                        content = content.replace(r'(\w+):', r'"\1":')
                        # Fix trailing commas
                        content = content.replace(',]', ']').replace(',}', '}')
                        # Fix missing quotes around property names
                        content = content.replace(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3')
                        # Fix missing quotes around string values
                        content = content.replace(r':\s*([^"\'\d\[\]{},]+)([,}])', r': "\1"\2')
                        # Fix missing quotes around array values
                        content = content.replace(r'\[([^"\'\d\[\]{},]+)\]', r'["\1"]')
                        # Fix missing quotes around object values
                        content = content.replace(r'{([^"\'\d\[\]{},]+)}', r'{"\1"}')
                        
                        print(f"Cleaned JSON content: {content}")
                        analysis = json.loads(content)
                    except json.JSONDecodeError as e2:
                        print(f"Error after attempting to fix JSON: {str(e2)}")
                        print(f"Cleaned content: {content}")
                        
                        # Third attempt: try to extract JSON from the response
                        try:
                            # Look for JSON-like structure between curly braces
                            import re
                            json_match = re.search(r'\{.*\}', content, re.DOTALL)
                            if json_match:
                                json_str = json_match.group(0)
                                # Clean up the extracted JSON
                                json_str = json_str.replace("'", '"')
                                json_str = json_str.replace(r'(\w+):', r'"\1":')
                                json_str = json_str.replace(',]', ']').replace(',}', '}')
                                json_str = json_str.replace(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3')
                                json_str = json_str.replace(r':\s*([^"\'\d\[\]{},]+)([,}])', r': "\1"\2')
                                json_str = json_str.replace(r'\[([^"\'\d\[\]{},]+)\]', r'["\1"]')
                                json_str = json_str.replace(r'{([^"\'\d\[\]{},]+)}', r'{"\1"}')
                                
                                print(f"Extracted and cleaned JSON: {json_str}")
                                analysis = json.loads(json_str)
                            else:
                                raise Exception("No JSON structure found in response")
                        except Exception as e3:
                            print(f"Error in final JSON extraction attempt: {str(e3)}")
                            raise Exception(f"Failed to parse GPT response as JSON: {str(e)}")
                
                # Validate the analysis structure
                required_fields = [
                    "meal_name", "ingredients", "cooking_method", "serving_size",
                    "calories", "protein", "carbs", "fats", "fiber", "sugar", "sodium",
                    "health_tags", "suggestions", "recommended_recipes", "macronutrient_split"
                ]
                
                for field in required_fields:
                    if field not in analysis:
                        print(f"Warning: Missing required field '{field}' in analysis")
                        if field in ["calories", "protein", "carbs", "fats", "fiber", "sugar", "sodium"]:
                            analysis[field] = 0
                        elif field in ["ingredients", "health_tags", "suggestions", "recommended_recipes"]:
                            analysis[field] = []
                        elif field == "macronutrient_split":
                            analysis[field] = {"protein_percentage": 0, "carbs_percentage": 0, "fats_percentage": 0}
                        else:
                            analysis[field] = ""
                
                return analysis
                
            except httpx.RequestError as e:
                print(f"HTTP request error: {str(e)}")
                print(f"Request details: URL=https://api.openai.com/v1/chat/completions, Headers={headers}")
                raise Exception(f"HTTP request failed: {str(e)}")
            
    except Exception as e:
        print(f"Error in analyze_meal_details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No additional details'}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise Exception(f"Failed to analyze meal details: {str(e)}") 