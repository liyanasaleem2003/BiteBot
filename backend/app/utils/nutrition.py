from typing import Dict, Any

def calculate_meal_scores(analysis: Dict[str, Any]) -> Dict[str, float]:
    """
    Calculate various health scores for a meal based on its nutritional content.
    """
    # Extract macronutrients
    calories = analysis.get("calories", 0)
    protein = analysis.get("protein", 0)
    carbs = analysis.get("carbs", 0)
    fats = analysis.get("fats", 0)
    fiber = analysis.get("fiber", 0)
    sugar = analysis.get("sugar", 0)
    sodium = analysis.get("sodium", 0)
    
    # Calculate glycemic index score (0-100)
    glycemic_index = calculate_glycemic_index(carbs, fiber, sugar)
    
    # Calculate inflammatory score (0-100)
    inflammatory = calculate_inflammatory_score(fats, sodium, fiber)
    
    # Calculate heart health score (0-100)
    heart_health = calculate_heart_health_score(fats, sodium, fiber)
    
    # Calculate digestive score (0-100)
    digestive = calculate_digestive_score(fiber, fats, sugar)
    
    # Calculate meal balance score (0-100)
    meal_balance = calculate_meal_balance_score(protein, carbs, fats, calories)
    
    return {
        "glycemic_index": glycemic_index,
        "inflammatory": inflammatory,
        "heart_health": heart_health,
        "digestive": digestive,
        "meal_balance": meal_balance
    }

def calculate_glycemic_index(carbs: float, fiber: float, sugar: float) -> float:
    """
    Calculate glycemic index score based on carbohydrate composition.
    Lower score is better.
    """
    if carbs == 0:
        return 0
    
    # Fiber helps lower glycemic index
    fiber_factor = min(fiber / carbs, 1) * 30
    
    # Sugar increases glycemic index
    sugar_factor = min(sugar / carbs, 1) * 40
    
    # Base score starts at 50
    base_score = 50
    
    # Adjust score based on factors
    score = base_score - fiber_factor + sugar_factor
    
    # Ensure score is between 0 and 100
    return max(0, min(100, score))

def calculate_inflammatory_score(fats: float, sodium: float, fiber: float) -> float:
    """
    Calculate inflammatory score based on fats, sodium, and fiber.
    Lower score is better.
    """
    # Base score starts at 50
    score = 50
    
    # Saturated fats increase inflammation
    if fats > 20:  # More than 20g of fats
        score += 10
    
    # High sodium increases inflammation
    if sodium > 2300:  # More than 2300mg
        score += 15
    
    # Fiber helps reduce inflammation
    if fiber > 5:  # More than 5g of fiber
        score -= 10
    
    # Ensure score is between 0 and 100
    return max(0, min(100, score))

def calculate_heart_health_score(fats: float, sodium: float, fiber: float) -> float:
    """
    Calculate heart health score based on fats, sodium, and fiber.
    Higher score is better.
    """
    # Base score starts at 50
    score = 50
    
    # Saturated fats are bad for heart health
    if fats > 20:  # More than 20g of fats
        score -= 15
    
    # High sodium is bad for heart health
    if sodium > 2300:  # More than 2300mg
        score -= 15
    
    # Fiber is good for heart health
    if fiber > 5:  # More than 5g of fiber
        score += 10
    
    # Ensure score is between 0 and 100
    return max(0, min(100, score))

def calculate_digestive_score(fiber: float, fats: float, sugar: float) -> float:
    """
    Calculate digestive score based on fiber, fats, and sugar.
    Higher score is better.
    """
    # Base score starts at 50
    score = 50
    
    # Fiber is good for digestion
    if fiber > 5:  # More than 5g of fiber
        score += 15
    
    # High fats can cause digestive issues
    if fats > 20:  # More than 20g of fats
        score -= 10
    
    # High sugar can cause digestive issues
    if sugar > 25:  # More than 25g of sugar
        score -= 10
    
    # Ensure score is between 0 and 100
    return max(0, min(100, score))

def calculate_meal_balance_score(protein: float, carbs: float, fats: float, calories: float) -> float:
    """
    Calculate meal balance score based on macronutrient distribution.
    Higher score is better.
    """
    if calories == 0:
        return 0
    
    # Calculate percentages
    protein_percent = (protein * 4 / calories) * 100
    carbs_percent = (carbs * 4 / calories) * 100
    fats_percent = (fats * 9 / calories) * 100
    
    # Ideal ranges
    ideal_protein = 20  # 20-30%
    ideal_carbs = 50    # 45-65%
    ideal_fats = 30     # 20-35%
    
    # Calculate deviation from ideal
    protein_deviation = abs(protein_percent - ideal_protein)
    carbs_deviation = abs(carbs_percent - ideal_carbs)
    fats_deviation = abs(fats_percent - ideal_fats)
    
    # Calculate score (100 - total deviation)
    score = 100 - (protein_deviation + carbs_deviation + fats_deviation)
    
    # Ensure score is between 0 and 100
    return max(0, min(100, score)) 