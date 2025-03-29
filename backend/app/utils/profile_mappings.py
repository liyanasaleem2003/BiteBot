HEALTH_CONDITION_MAPPINGS = {
    "diabetes": "Type 2 Diabetes / Prediabetes",
    "hypertension": "Hypertension (High Blood Pressure)",
    "cholesterol": "High Cholesterol (Hyperlipidemia)",
    "anemia": "Iron-Deficiency Anemia",
    "vitaminD": "Vitamin D Deficiency / Osteoporosis",
    "lactose_intolerance": "Lactose Intolerance",
    "acidReflux": "Acid Reflux / GERD",
    "ibs": "IBS / Digestive Issues",
    "arthritis": "Joint Pain / Arthritis"
}

ACTIVITY_LEVEL_MAPPINGS = {
    "sedentary": "Sedentary (little or no exercise)",
    "light": "Lightly active (light exercise/sports 1-3 days/week)",
    "moderate": "Moderately active (moderate exercise/sports 3-5 days/week)",
    "very": "Very active (hard exercise/sports 6-7 days/week)",
    "extra": "Extra active (very hard exercise/sports & physical job or training twice per day)"
}

MICRONUTRIENT_MAPPINGS = {
    "iron": "Iron",
    "vitamin_d": "Vitamin D",
    "vitamin_b12": "Vitamin B12",
    "calcium": "Calcium",
    "zinc": "Zinc",
    "omega_3": "Omega-3",
    "magnesium": "Magnesium",
    "potassium": "Potassium",
    "folate": "Folate (B9)"
}

HEALTH_GOAL_MAPPINGS = {
    "weight_loss": "Weight Loss",
    "weight_gain": "Weight Gain",
    "muscle": "Build Muscle",
    "heart": "Improve Heart Health",
    "immunity": "Boost Immunity",
    "digestive": "Enhance Digestive Health",
    "skin_joint": "Improve Skin/Joint Health",
    "cellular": "Improve Cellular Health",
    "diabetes": "Manage Diabetes",
    "blood_pressure": "Control Blood Pressure",
    "cholesterol": "Manage Cholesterol",
    "energy": "Increase Energy Levels",
    "sleep": "Improve Sleep Quality"
}

def map_health_conditions(condition_ids: list) -> list:
    """Convert health condition IDs to their full text labels"""
    return [HEALTH_CONDITION_MAPPINGS.get(condition_id, condition_id) for condition_id in condition_ids]

def map_activity_level(activity_id: str) -> str:
    """Convert activity level ID to its full text label"""
    return ACTIVITY_LEVEL_MAPPINGS.get(activity_id, activity_id)

def map_micronutrients(nutrient_ids: list) -> list:
    """Convert micronutrient IDs to their full text labels"""
    return [MICRONUTRIENT_MAPPINGS.get(nutrient_id, nutrient_id) for nutrient_id in nutrient_ids]

def map_health_goals(goal_ids: list) -> list:
    """Convert health goal IDs to their full text labels"""
    return [HEALTH_GOAL_MAPPINGS.get(goal_id, goal_id) for goal_id in goal_ids] 