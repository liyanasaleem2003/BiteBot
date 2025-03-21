import React, { useState, useEffect } from "react";
import { RecipeCard } from "../components/ui/RecipeCard";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import "./Recipes.css";

// Filter Categories
const dietaryOptions = ["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Lactose-Free", "Gluten-Free"];
const healthGoals = ["Low-Sugar", "High-Protein", "Heart-Healthy", "Digestive Health", "Iron & Folate Rich", "Immunity Boosting", "Skin & Joint Health"];
const mealTypes = ["Breakfast", "Snacks/In-Between Meals", "Lunch", "Desserts/Sweet Treats", "Dinner"];
const culturalStyles = ["Authentic", "Fusion"];
const mealPreferences = ["Quick-to-Prepare", "Meal-Prep Friendly", "Family-Friendly"];

export default function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]); // All recipes from backend
  const [filteredRecipes, setFilteredRecipes] = useState([]); // Recipes that match filters
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  // Filter states
  const [selectedDietary, setSelectedDietary] = useState(new Set());
  const [selectedHealth, setSelectedHealth] = useState(new Set());
  const [selectedMealType, setSelectedMealType] = useState(new Set());
  const [selectedCultural, setSelectedCultural] = useState(new Set());
  const [selectedPreferences, setSelectedPreferences] = useState(new Set());

  // Fetch Recipes from Backend
  useEffect(() => {
    fetch("http://localhost:8000/recipes") // Ensure correct URL
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRecipes(data);
          setFilteredRecipes(data); // Set default filtered list to all recipes
        } else {
          console.error("Unexpected API response:", data);
          setRecipes([]);
          setFilteredRecipes([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching recipes:", error);
        setRecipes([]);
        setFilteredRecipes([]);
        setLoading(false);
      });
  }, []);

  // Function to filter recipes based on selected criteria
  useEffect(() => {
    let updatedRecipes = [...recipes];

    if (selectedDietary.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe =>
        selectedDietary.has(recipe.dietaryPreference)
      );
    }

    if (selectedHealth.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe =>
        recipe.healthBenefits.some(benefit => selectedHealth.has(benefit))
      );
    }

    if (selectedMealType.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe =>
        selectedMealType.has(recipe.mealType)
      );
    }

    if (selectedCultural.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe =>
        selectedCultural.has(recipe.culturalStyle)
      );
    }

    if (selectedPreferences.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe =>
        selectedPreferences.has(recipe.mealPreference)
      );
    }

    setFilteredRecipes(updatedRecipes);
  }, [selectedDietary, selectedHealth, selectedMealType, selectedCultural, selectedPreferences, recipes]);

  // Toggle Favorite Function
  const toggleFavorite = (title) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(title)) {
      newFavorites.delete(title);
    } else {
      newFavorites.add(title);
    }
    setFavorites(newFavorites);
  };

  // Toggle Dietary Filter Function (Max 2)
  const toggleDietaryFilter = (option) => {
    const newSet = new Set(selectedDietary);

    if (newSet.has(option)) {
      newSet.delete(option);
    } else if (newSet.size < 2) {
      newSet.add(option);
    }
    setSelectedDietary(newSet);
  };

  // General Toggle Function for Multi-Select Filters (Max Selection)
  const toggleMultiSelection = (value, selectedSet, setSelectedSet, maxSelections) => {
    const newSet = new Set(selectedSet);

    if (newSet.has(value)) {
      newSet.delete(value);
    } else if (selectedSet.size < maxSelections) {
      newSet.add(value);
    }

    setSelectedSet(newSet);
  };

  if (loading) return <p>Loading recipes...</p>;
  if (error) return <p>Error loading recipes: {error.message}</p>;

  return (
    <div className="recipes-page">
      <Navbar />

      <div className="container">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          <div className="sidebar-content">
            <h2>Filter Recipes</h2>

            {/* Dietary Preferences */}
            <h3 className="filter-title">Dietary Preferences (Max 2)</h3>
            <div className="filter-group">
              {dietaryOptions.map((pref) => (
                <button
                  key={pref}
                  className={`filter-button ${selectedDietary.has(pref) ? "selected" : ""}`}
                  onClick={() => toggleDietaryFilter(pref)}
                >
                  {pref}
                </button>
              ))}
            </div>

            {/* Health Goals (Max 3) */}
            <h3 className="filter-title">Health Goals (Max 3)</h3>
            <div className="filter-group">
              {healthGoals.map((goal) => (
                <button
                  key={goal}
                  className={`filter-button ${selectedHealth.has(goal) ? "selected" : ""}`}
                  onClick={() => toggleMultiSelection(goal, selectedHealth, setSelectedHealth, 3)}
                >
                  {goal}
                </button>
              ))}
            </div>

            {/* Meal Type */}
            <h3 className="filter-title">Meal Type</h3>
            <div className="filter-group">
              {mealTypes.map((type) => (
                <button
                  key={type}
                  className={`filter-button ${selectedMealType.has(type) ? "selected" : ""}`}
                  onClick={() => toggleMultiSelection(type, selectedMealType, setSelectedMealType, 1)}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Cultural Style */}
            <h3 className="filter-title">Cultural Style</h3>
            <div className="filter-group">
              {culturalStyles.map((style) => (
                <button
                  key={style}
                  className={`filter-button ${selectedCultural.has(style) ? "selected" : ""}`}
                  onClick={() => toggleMultiSelection(style, selectedCultural, setSelectedCultural, 1)}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Meal Preferences */}
            <h3 className="filter-title">Meal Preferences</h3>
            <div className="filter-group">
              {mealPreferences.map((pref) => (
                <button
                  key={pref}
                  className={`filter-button ${selectedPreferences.has(pref) ? "selected" : ""}`}
                  onClick={() => toggleMultiSelection(pref, selectedPreferences, setSelectedPreferences, 1)}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Recipe Grid */}
        <main className="recipe-list">
          <h1>Explore our healthier versions of your favorite South Asian recipes</h1>
          <div className="recipes-grid">
            {filteredRecipes.map((recipe, index) => (
              <RecipeCard key={index} {...recipe} isFavorite={favorites.has(recipe.title)} onFavoriteToggle={() => toggleFavorite(recipe.title)} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
