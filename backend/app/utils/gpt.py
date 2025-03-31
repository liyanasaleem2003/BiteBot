import asyncio
import base64
import json
import os
import re
from dotenv import load_dotenv
from typing import Dict, Any, List
import httpx
from app.config import settings
import openai

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
        
        # First prompt: Detect ingredients and estimate proportions
        initial_prompt = """
        You are a friendly and knowledgeable nutritionist having a conversation with a user about their meal. Look at this meal image and engage in a natural dialogue to understand more about it.

        First, identify ALL ingredients you can see in the image, including:
        1. Main components (rice, pasta, bread, meat, etc.)
        2. Vegetables and fruits
        3. Spices and herbs (be specific - look for mustard seeds, cilantro, basil, etc.)
        4. Sauces and condiments
        5. Garnishes and toppings
        
        Pay special attention to small but important ingredients like:
        - Spices (mustard seeds, cumin seeds, cardamom, cloves)
        - Fresh herbs (cilantro, mint, basil, parsley)
        - Garnishes (lemon wedges, chopped nuts)
        - Oils used (ghee, olive oil, sesame oil)
        
        For each ingredient, provide an approximate portion size using these guidelines:
        - For main components (rice, pasta, proteins): Estimate in cups (e.g., "1 cup rice", "1/2 cup chicken")
        - For vegetables: Estimate in cups or tablespoons (e.g., "1/2 cup green beans", "2 tbsp onions")
        - For spices and herbs: Estimate in teaspoons or as garnish (e.g., "1/4 tsp mustard seeds", "cilantro garnish")
        - For oils and sauces: Estimate in tablespoons or teaspoons (e.g., "1 tbsp olive oil", "2 tsp sauce")
        
        Use standard nutritional serving sizes as a reference:
        - 1 cup of rice/pasta = ~200g
        - 1 cup of vegetables = ~100g
        - 1 serving of protein = ~85g (3oz)
        - 1 tablespoon of oil = ~15g
        
        Be as detailed as possible in your assessment. Then, ask relevant questions to gather more information about the meal. Your questions should be conversational and specific to what you observe.

        For example, if you see a curry, you might say:
        "I can see this is a curry dish with approximately 1 cup of rice, 1/2 cup of vegetable curry, and I notice mustard seeds (about 1/4 tsp) and cilantro garnish. Could you tell me what type of curry sauce was used? Was it made with coconut milk, tomato base, or something else?"

        Or if you see a salad:
        "This looks like a fresh salad! I can see about 2 cups of mixed greens, 1/4 cup of cherry tomatoes, approximately 3oz of grilled chicken, and what appears to be about 2 tbsp of dressing. I notice some herbs like cilantro or parsley (about 1 tsp). What type of dressing did you use on this?"

        Return a JSON object with the following structure:
        {
            "detected_ingredients": [{"name": "ingredient1", "portion": "approximate amount in standard measurements"}, ...],
            "confidence_level": "high/medium/low",
            "meal_type": "breakfast/lunch/dinner/snack/dessert",
            "clarifying_questions": [
                {
                    "category": "preparation",
                    "question": "A natural, conversational question about the meal",
                    "validation_rules": {
                        "required_terms": ["term1", "term2"],
                        "excluded_terms": ["term1", "term2"],
                        "format": "amount_unit"
                    }
                }
            ]
        }

        Guidelines for questions:
        1. Make questions conversational and specific to what you observe
        2. Focus on preparation methods, types of oils or dals, and significant nutritional factors
        3. Combine related questions into single queries (e.g., type and amount of oil)
        4. Limit to 3-4 main questions, prioritizing those with the most impact on nutritional values
        5. Include a variety of topics such as cooking methods, ingredient types, and portion sizes
        6. Avoid asking multiple questions about the same topic, like oil, if already covered
        7. Adapt your questions based on the meal type (snack vs. main meal)

        Example validation rules:
        - For oil/fat: required_terms=["tbsp", "tsp", "ml"], format="amount_unit"
        - For serving size: required_terms=["cup", "g", "piece"], format="amount_unit"
        - For cooking method: required_terms=["fried", "baked", "boiled", "roasted"]
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
                    "role": "system",
                    "content": "You are a friendly and knowledgeable nutritionist having a natural conversation with users about their meals. Your responses should be conversational, specific to what you observe, and focused on gathering accurate nutritional information."
                },
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
        
        async with httpx.AsyncClient(timeout=60.0) as client:  # 60 second timeout
            max_retries = 3
            retry_delay = 1
            
            for attempt in range(max_retries):
                try:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers=headers,
                        json=payload,
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
                    
                    # Extract JSON from the response
                    try:
                        # Look for JSON content between ```json and ``` markers
                        import re
                        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
                        
                        if json_match:
                            # Extract just the JSON part
                            json_content = json_match.group(1).strip()
                            print(f"Extracted JSON content: {json_content}")
                            try:
                                initial_analysis = json.loads(json_content)
                                print("Successfully parsed extracted JSON")
                            except json.JSONDecodeError as e:
                                print(f"Error parsing extracted JSON: {str(e)}")
                                raise Exception(f"Failed to parse extracted JSON: {str(e)}")
                        else:
                            # If no JSON block is found, try the original parsing approach
                            print("No JSON code block found, trying alternative parsing methods")
                            
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
                                initial_analysis = json.loads(content)
                            except json.JSONDecodeError as e:
                                print(f"Initial JSON parsing failed: {str(e)}")
                                print(f"Raw response: {content}")
                                
                                # Second attempt: try to extract JSON from the response
                                try:
                                    # Look for JSON-like structure between curly braces
                                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                                    if json_match:
                                        json_str = json_match.group(0)
                                        print(f"Extracted JSON structure: {json_str}")
                                        initial_analysis = json.loads(json_str)
                                    else:
                                        raise Exception("No JSON structure found in response")
                                except Exception as e3:
                                    print(f"Error in final JSON extraction attempt: {str(e3)}")
                                    raise Exception(f"Failed to parse GPT response as JSON: {str(e)}")
                    except Exception as e:
                        print(f"Error extracting or parsing JSON: {str(e)}")
                        raise Exception(f"Failed to extract or parse JSON from response: {str(e)}")

                    # Extract ingredients from the first response
                    ingredients_list = []
                    for ingredient in initial_analysis.get("detected_ingredients", []):
                        ingredient_name = ingredient.get("name", "")
                        portion = ingredient.get("portion", "unknown amount")
                        ingredients_list.append(f"{ingredient_name} ({portion})")
                    
                    print("\n=== EXTRACTED INGREDIENTS ===")
                    print(f"Ingredients: {', '.join(ingredients_list)}")
                    
                    return initial_analysis
                    
                except (httpx.ReadTimeout, httpx.ConnectTimeout) as e:
                    if attempt == max_retries - 1:  # Last attempt
                        print(f"Failed after {max_retries} attempts: {str(e)}")
                        raise Exception(f"Request timed out after {max_retries} attempts")
                    else:
                        print(f"Attempt {attempt + 1} failed, retrying in {retry_delay} seconds...")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                
                except Exception as e:
                    print(f"Unexpected error: {str(e)}")
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
        # Extract priority micronutrients from user profile
        priority_micronutrients = user_profile.get('priority_micronutrients', [])
        priority_micronutrients_str = ', '.join(priority_micronutrients) if priority_micronutrients else "None specified"
        
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
        - Priority Micronutrients: {priority_micronutrients_str}

        Conversation History:
        {json.dumps(conversation_history, indent=2)}

        Please provide a comprehensive analysis in the following JSON format with specific numerical values:
        {{
            "meal_name": "A descriptive name that includes the main ingredients and cooking style",
            "ingredients": ["ingredient1", "ingredient2", ...],
            "cooking_method": "method",
            "serving_size": "size",
            "calories": number,
            "protein": number,
            "carbs": number,
            "fats": number,
            "fiber": number,
            "sugar": number,
            "sodium": number,
            "health_tags": ["Tag1", "Tag2", "Tag3"],
            "suggestions": ["suggestion1", "suggestion2", ...],
            "recommended_recipes": ["recipe1", "recipe2", ...],
            "macronutrient_split": {{
                "protein_percentage": number,
                "carbs_percentage": number,
                "fats_percentage": number
            }},
            "health_benefits": ["benefit1", "benefit2", ...],
            "potential_concerns": ["concern1", "concern2", ...],
            "micronutrients": {{
                "vitamin_a": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}},
                "vitamin_c": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "vitamin_d": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}},
                "vitamin_e": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "vitamin_k": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}},
                "vitamin_b1": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "vitamin_b2": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "vitamin_b3": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "vitamin_b6": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "vitamin_b12": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}},
                "folate": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}},
                "calcium": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "iron": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "magnesium": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "phosphorus": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "potassium": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "zinc": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "copper": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "manganese": {{"amount": number, "unit": "mg", "percentage_of_daily": number}},
                "selenium": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}},
                "chromium": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}},
                "iodine": {{"amount": number, "unit": "mcg", "percentage_of_daily": number}}
            }},
            "micronutrient_balance": {{
                "score": number,  # Average percentage of daily recommended intake for priority micronutrients
                "priority_nutrients": [  # List of priority micronutrients and their percentages
                    {{"name": "nutrient_name", "percentage": number}},
                    ...
                ]
            }}
        }}

        The meal name should:
        1. Include the main ingredients detected
        2. Reflect the cooking method used
        3. Be specific to the actual dish (not generic)
        4. Follow common naming conventions for the cuisine
        5. Be 3-6 words long
        6. Be descriptive enough that someone could understand what the meal is
        7. Use proper capitalization (capitalize each major word)
        
        For health_tags:
        1. Provide ONLY 3-5 health tags maximum
        2. Focus on health BENEFITS of the meal (not dietary restrictions like "Gluten-Free" or "Vegan")
        3. Each tag should start with a capital letter
        4. Examples of good health tags: "Heart Healthy", "Anti-Inflammatory", "Immune Boosting", "Energy Enhancing", "Gut Friendly"
        5. The tags should be directly related to the meal's health benefits, not just its nutritional content
        
        The suggestions should be specific, actionable improvements that could make the meal healthier.
        The recommended recipes should be similar to the analyzed meal but with healthier modifications.
        
        IMPORTANT: Do NOT suggest adding ingredients that are already present in the meal. For example, if the meal already contains olive oil, turmeric, cumin seeds, or coriander, do not suggest adding these ingredients.
        Instead, focus on:
        1. Suggesting different ingredients that are not already present
        2. Suggesting modifications to cooking methods
        3. Suggesting portion size adjustments
        4. Suggesting complementary foods to eat with the meal
        
        IMPORTANT: For the micronutrient_balance section, ONLY include the user's priority micronutrients: {priority_micronutrients_str}. 
        Calculate the score as the average percentage of daily recommended intake for ONLY these specific nutrients.
        If no priority micronutrients are specified, leave the priority_nutrients list empty and set the score to 0.
        """
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare the request data
        request_data = {
            "model": "gpt-4o-mini-2024-07-18",
            "messages": [
                {"role": "system", "content": "You are a nutritional analysis AI that provides detailed meal analysis."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,
            "max_tokens": 2000
        }
        
        # Make the API request
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=request_data
            )
            
            # Check if the request was successful
            if response.status_code != 200:
                print(f"Error from OpenAI API: {response.text}")
                raise Exception(f"OpenAI API returned an error: {response.text}")
            
            # Parse the response
            response_data = response.json()
            content = response_data["choices"][0]["message"]["content"]
            
            # Extract the JSON from the response
            try:
                # Try to parse the entire response as JSON
                analysis = json.loads(content)
            except json.JSONDecodeError:
                # If that fails, try to extract JSON from the response
                try:
                    match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
                    if match:
                        json_str = match.group(1)
                        analysis = json.loads(json_str)
                    else:
                        # Try to find JSON between curly braces
                        match = re.search(r'({.*})', content, re.DOTALL)
                        if match:
                            json_str = match.group(1)
                            analysis = json.loads(json_str)
                        else:
                            raise Exception("Could not extract JSON from response")
                except Exception as e:
                    print(f"Error extracting JSON: {str(e)}")
                    print(f"Raw response: {content}")
                    raise Exception(f"Failed to extract JSON from response: {str(e)}")
        
        # Process health tags - ensure they're capitalized and limited to 3-5
        if "health_tags" in analysis:
            # Capitalize first letter of each tag
            health_tags = [tag.capitalize() for tag in analysis["health_tags"]]
            
            # Limit to 3-5 tags
            if len(health_tags) > 5:
                health_tags = health_tags[:5]
            elif len(health_tags) < 3 and "health_benefits" in analysis and analysis["health_benefits"]:
                # If we have fewer than 3 tags but have health benefits, convert some benefits to tags
                for benefit in analysis["health_benefits"]:
                    if len(health_tags) < 3:
                        # Convert benefit to tag format (shorter, capitalized)
                        benefit_words = benefit.split()
                        if len(benefit_words) > 3:
                            # Shorten long benefits
                            tag = " ".join(benefit_words[:3]).capitalize()
                        else:
                            tag = benefit.capitalize()
                        
                        # Only add if not already present
                        if tag not in health_tags:
                            health_tags.append(tag)
            
            analysis["health_tags"] = health_tags
        
        # Ensure micronutrient_balance is properly formatted
        if "micronutrient_balance" not in analysis or not analysis["micronutrient_balance"]:
            # Calculate micronutrient balance manually
            micronutrients = analysis.get("micronutrients", {})
            
            # Only use user's priority micronutrients, no defaults
            # Extract percentages for priority nutrients
            priority_nutrients = []
            total_percentage = 0
            count = 0
            
            # Only proceed if there are priority micronutrients
            if priority_micronutrients:
                for nutrient in priority_micronutrients:
                    # Convert to snake_case if needed
                    nutrient_key = nutrient.lower().replace(" ", "_")
                    
                    if nutrient_key in micronutrients:
                        percentage = micronutrients[nutrient_key].get("percentage_of_daily", 0)
                        priority_nutrients.append({
                            "name": nutrient,
                            "percentage": percentage
                        })
                        total_percentage += percentage
                        count += 1
            
            # Calculate average score
            score = total_percentage / count if count > 0 else 0
            
            # Set the micronutrient balance
            analysis["micronutrient_balance"] = {
                "score": round(score, 1),
                "priority_nutrients": priority_nutrients
            }
        else:
            # Ensure the micronutrient_balance only contains priority nutrients
            if priority_micronutrients:
                existing_balance = analysis["micronutrient_balance"]
                filtered_nutrients = []
                total_percentage = 0
                count = 0
                
                # Filter to only include priority nutrients
                for nutrient_info in existing_balance.get("priority_nutrients", []):
                    nutrient_name = nutrient_info.get("name", "").lower().replace(" ", "_")
                    if any(pn.lower().replace(" ", "_") == nutrient_name for pn in priority_micronutrients):
                        filtered_nutrients.append(nutrient_info)
                        total_percentage += nutrient_info.get("percentage", 0)
                        count += 1
                
                # Recalculate score based only on priority nutrients
                score = total_percentage / count if count > 0 else 0
                
                analysis["micronutrient_balance"] = {
                    "score": round(score, 1),
                    "priority_nutrients": filtered_nutrients
                }
            else:
                # If no priority nutrients, set empty list and score to 0
                analysis["micronutrient_balance"] = {
                    "score": 0,
                    "priority_nutrients": []
                }
        
        return analysis
        
    except Exception as e:
        print(f"Error in analyze_meal_details: {str(e)}")
        raise Exception(f"Failed to analyze meal details: {str(e)}")