import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button-ui';

const NutritionDashboard = () => {
  const [nutritionalPlan, setNutritionalPlan] = useState(null);
  const [dailyProgress, setDailyProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNutritionalData();
  }, []);

  const fetchNutritionalData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/nutrition/calculate-needs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nutritional data');
      }

      const data = await response.json();
      setNutritionalPlan(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!nutritionalPlan) {
    return <div>No nutritional plan available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Daily Targets */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Nutritional Targets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Daily Calories</p>
            <p className="text-2xl font-bold">{nutritionalPlan.daily_calories}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Protein</p>
            <p className="text-2xl font-bold">{nutritionalPlan.macros.protein.grams}g</p>
            <p className="text-sm text-gray-600">{nutritionalPlan.macros.protein.percentage}%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Carbs</p>
            <p className="text-2xl font-bold">{nutritionalPlan.macros.carbs.grams}g</p>
            <p className="text-sm text-gray-600">{nutritionalPlan.macros.carbs.percentage}%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Fats</p>
            <p className="text-2xl font-bold">{nutritionalPlan.macros.fats.grams}g</p>
            <p className="text-sm text-gray-600">{nutritionalPlan.macros.fats.percentage}%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Fiber</p>
            <p className="text-2xl font-bold">{nutritionalPlan.fiber.grams}g</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Sugar</p>
            <p className="text-2xl font-bold">{nutritionalPlan.sugar.grams}g</p>
            <p className="text-sm text-gray-600">{nutritionalPlan.sugar.percentage_of_carbs}% of carbs</p>
          </div>
        </div>
      </Card>

      {/* Micronutrient Targets */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Micronutrient Targets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(nutritionalPlan.micronutrient_targets).map(([nutrient, data]) => (
            <div key={nutrient} className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 capitalize">{nutrient.replace('_', ' ')}</p>
              <p className="text-2xl font-bold">{data.amount} {data.unit}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Meal Timing */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recommended Meal Timing</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Meals per day: {nutritionalPlan.meal_timing.meals_per_day}</p>
            <div className="mt-2">
              <h3 className="font-medium mb-2">Suggested Times:</h3>
              <ul className="list-disc list-inside space-y-1">
                {nutritionalPlan.meal_timing.suggested_times.map((time, index) => (
                  <li key={index} className="text-sm">{time}</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Portion Distribution:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(nutritionalPlan.meal_timing.portion_distribution).map(([meal, percentage]) => (
                <div key={meal} className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 capitalize">{meal}</p>
                  <p className="text-xl font-bold">{percentage}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Personalized Recommendations</h2>
        <ul className="space-y-2">
          {nutritionalPlan.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default NutritionDashboard; 