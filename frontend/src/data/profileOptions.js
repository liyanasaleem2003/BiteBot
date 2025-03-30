export const healthIssueOptions = [
  { id: "diabetes", label: "Type 2 Diabetes / Prediabetes" },
  { id: "hypertension", label: "Hypertension (High Blood Pressure)" },
  { id: "cholesterol", label: "High Cholesterol (Hyperlipidemia)" },
  { id: "anemia", label: "Iron-Deficiency Anemia" },
  { id: "vitaminD", label: "Vitamin D Deficiency / Osteoporosis" },
  { id: "lactose_intolerance", label: "Lactose Intolerance" },
  { id: "acidReflux", label: "Acid Reflux / GERD" },
  { id: "ibs", label: "IBS / Digestive Issues" },
  { id: "arthritis", label: "Joint Pain / Arthritis" }
];

export const foodsToAvoidOptions = [
  { id: "dairy", label: "Dairy" },
  { id: "gluten", label: "Gluten" },
  { id: "nuts", label: "Nuts" },
  { id: "shellfish", label: "Shellfish" },
  { id: "soy", label: "Soy" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "red-meat", label: "Red Meat" }
];

export const micronutrientOptions = [
  { 
    id: "iron", 
    label: "Iron",
    recommendations: ["Iron-Deficiency Anemia"],
    description: "Essential for red blood cell production and oxygen transport"
  },
  { 
    id: "vitaminB12", 
    label: "Vitamin B12",
    recommendations: ["Iron-Deficiency Anemia", "Vegetarian"],
    description: "Crucial for nerve function and red blood cell formation"
  },
  { 
    id: "folate", 
    label: "Folate (B9)",
    recommendations: ["Iron-Deficiency Anemia"],
    description: "Important for cell division and DNA synthesis"
  },
  { 
    id: "vitaminD", 
    label: "Vitamin D",
    recommendations: ["Vitamin D Deficiency / Osteoporosis"],
    description: "Helps calcium absorption and bone health"
  },
  { 
    id: "calcium", 
    label: "Calcium",
    recommendations: ["Vitamin D Deficiency / Osteoporosis", "Lactose Intolerance"],
    description: "Essential for bone strength and muscle function"
  },
  { 
    id: "omega3", 
    label: "Omega-3",
    recommendations: ["High Cholesterol (Hyperlipidemia)", "Joint Pain / Arthritis"],
    description: "Supports heart health and reduces inflammation"
  },
  { 
    id: "potassium", 
    label: "Potassium",
    recommendations: ["Hypertension (High Blood Pressure)"],
    description: "Helps regulate blood pressure and fluid balance"
  },
  { 
    id: "magnesium", 
    label: "Magnesium",
    recommendations: ["Hypertension (High Blood Pressure)", "Vitamin D Deficiency / Osteoporosis"],
    description: "Supports bone health and blood pressure regulation"
  },
  { 
    id: "zinc", 
    label: "Zinc",
    recommendations: ["IBS / Digestive Issues"],
    description: "Important for immune function and digestive health"
  }
];

export const healthGoalOptions = [
  { id: "diabetes", label: "Manage diabetes" },
  { id: "muscle", label: "Build muscle" },
  { id: "heart", label: "Improve heart health" },
  { id: "immunity", label: "Boost immunity" },
  { id: "digestive", label: "Enhance digestive health" },
  { id: "skin-joint", label: "Improve skin/joint health" },
  { id: "cellular", label: "Improve cellular health" }
];

export const dietaryOptions = ["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Lactose-Free", "Gluten-Free"];

export const activityLevelOptions = [
  { id: "sedentary", label: "Sedentary (little or no exercise)" },
  { id: "light", label: "Lightly active (light exercise/sports 1-3 days/week)" },
  { id: "moderate", label: "Moderately active (moderate exercise/sports 3-5 days/week)" },
  { id: "very", label: "Very active (hard exercise/sports 6-7 days/week)" },
  { id: "extra", label: "Extra active (very hard exercise/sports & physical job or training twice per day)" }
];

export const healthConditionRecommendations = {
  "diabetes": {
    title: "Type 2 Diabetes / Prediabetes",
    nutrients: ["potassium", "magnesium", "omega3"],
    message: "These nutrients help manage blood sugar levels and support heart health. Consider tracking these to optimize your diet!",
    details: "Potassium and magnesium help with insulin sensitivity, while omega-3 supports cardiovascular health which is important for diabetes management."
  },
  "anemia": {
    title: "Iron-Deficiency Anemia",
    nutrients: ["iron", "vitaminB12", "folate"],
    message: "People with anemia often have low iron and B12 levels. Consider tracking these to optimize your diet!",
    details: "Iron is essential for red blood cell production, while B12 and folate support healthy blood formation."
  },
  "hypertension": {
    title: "Hypertension (High Blood Pressure)",
    nutrients: ["potassium", "magnesium", "omega3"],
    message: "Potassium and Magnesium help regulate blood pressure. Omega-3 supports heart health. Consider tracking these!",
    details: "These nutrients work together to maintain healthy blood pressure levels and cardiovascular function."
  },
  "vitaminD": {
    title: "Vitamin D Deficiency / Osteoporosis",
    nutrients: ["vitaminD", "calcium", "magnesium"],
    message: "Vitamin D helps your body absorb calcium for strong bones. Magnesium supports bone density!",
    details: "This combination of nutrients is crucial for maintaining strong bones and preventing bone loss."
  },
  "cholesterol": {
    title: "High Cholesterol (Hyperlipidemia)",
    nutrients: ["omega3", "potassium", "magnesium"],
    message: "Omega-3 fatty acids help manage cholesterol levels. Potassium and magnesium support heart health!",
    details: "These nutrients work together to maintain healthy cholesterol levels and cardiovascular function."
  },
  "lactose_intolerance": {
    title: "Lactose Intolerance",
    nutrients: ["calcium", "vitaminD", "magnesium"],
    message: "Since dairy is limited, focus on calcium-rich alternatives and supporting nutrients!",
    details: "These nutrients help maintain bone health without relying on dairy sources."
  },
  "acidReflux": {
    title: "Acid Reflux / GERD",
    nutrients: ["magnesium", "zinc", "vitaminB12"],
    message: "These nutrients support digestive health and help maintain proper stomach acid levels!",
    details: "Magnesium helps relax the esophageal sphincter, while zinc and B12 support digestive function."
  },
  "ibs": {
    title: "IBS / Digestive Issues",
    nutrients: ["zinc", "magnesium", "vitaminB12"],
    message: "These nutrients support digestive health and help maintain gut function!",
    details: "Zinc supports gut lining health, while magnesium helps with muscle relaxation and B12 supports nerve function."
  },
  "arthritis": {
    title: "Joint Pain / Arthritis",
    nutrients: ["omega3", "vitaminD", "magnesium"],
    message: "Omega-3 reduces inflammation, while Vitamin D and Magnesium support joint health!",
    details: "These nutrients work together to reduce inflammation and maintain joint function."
  }
}; 