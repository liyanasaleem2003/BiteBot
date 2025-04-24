const analyzeMealResponse = await fetch(`${API_BASE_URL}/api/nutrition/analyze-meal`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: formData,
});

const analyzeDetailsResponse = await fetch(`${API_BASE_URL}/api/nutrition/analyze-details`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    conversation_history: conversationHistory,
    user_profile: JSON.parse(localStorage.getItem('userProfile') || '{}')
  })
});

const recipeRecommendationsResponse = await fetch(`${API_BASE_URL}/api/nutrition/recipe-recommendations`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    meal_analysis: mealAnalysis
  })
}); 