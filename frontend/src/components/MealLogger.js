import React, { useState, useEffect } from 'react';
import { Button } from './ui/button-ui';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { API_BASE_URL } from '../config';

const MealLogger = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mealAnalysis, setMealAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/nutrition/analyze-meal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze meal');
      }

      const data = await response.json();
      setMealAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="meal-photo">Upload Meal Photo</Label>
          <Input
            id="meal-photo"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="mt-2"
          />
        </div>

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Meal preview"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="w-full"
        >
          {loading ? 'Analyzing...' : 'Analyze Meal'}
        </Button>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}

        {mealAnalysis && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Meal Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Calories</p>
                <p className="text-xl font-bold">{mealAnalysis.total_calories}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Protein</p>
                <p className="text-xl font-bold">{mealAnalysis.total_macros.protein}g</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Carbs</p>
                <p className="text-xl font-bold">{mealAnalysis.total_macros.carbs}g</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Fats</p>
                <p className="text-xl font-bold">{mealAnalysis.total_macros.fats}g</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Fiber</p>
                <p className="text-xl font-bold">{mealAnalysis.total_fiber}g</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Sugar</p>
                <p className="text-xl font-bold">{mealAnalysis.total_sugar}g</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Food Items</h4>
              <ul className="space-y-2">
                {mealAnalysis.food_items.map((item, index) => (
                  <li key={index} className="text-sm">
                    {item.name} ({item.portion_size}) - {item.estimated_calories} calories
                  </li>
                ))}
              </ul>
            </div>

            {mealAnalysis.health_notes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Health Notes</h4>
                <ul className="space-y-1">
                  {mealAnalysis.health_notes.map((note, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MealLogger; 