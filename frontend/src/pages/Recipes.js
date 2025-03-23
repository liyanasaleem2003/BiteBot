import React, { useState, useEffect } from "react";
import { RecipeCard } from "../components/ui/RecipeCard";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import { Search } from "lucide-react";
import "./Recipes.css";

// Filter Categories
const dietaryOptions = [
    "Vegetarian",
    "Non-Vegetarian",
    "Vegan",
    "Pescatarian",
    "Lactose-Free",
    "Gluten-Free"
];
const healthGoals = [
  "Low-Sugar",
  "High-Protein",
  "Heart-Healthy",
  "Digestive Health",
  "Iron & Folate Rich",
  "Immunity Boosting",
  "Skin & Joint Health"
];
const mealTypes = ["Breakfast", "Snacks/In-Between Meals", "Lunch", "Desserts/Sweet Treats", "Dinner"];
const culturalStyles = ["Authentic", "Fusion"];
const mealPreferences = ["Quick-to-Prepare", "Meal-Prep Friendly", "Family-Friendly"];

// Update healthBenefitsMapping to match main categories exactly
const healthBenefitsMapping = {
    "Low-Sugar": ["Low-Sugar"],
    "High-Protein": ["High-Protein"],
    "Heart-Healthy": ["Heart-Healthy"],
    "Digestive Health": ["Digestive Health"],
    "Iron & Folate Rich": ["Iron & Folate Rich"],
    "Immunity Boosting": ["Immunity Boosting"],
    "Skin & Joint Health": ["Skin & Joint Health"]
};

// Update the dietary mapping
const dietaryMapping = {
    "Vegetarian": ["Vegetarian", "Veg", "Pure Vegetarian"],
    "Non-Vegetarian": ["Non-Vegetarian", "Non Veg", "Non-Veg"],
    "Vegan": ["Vegan"],
    "Pescatarian": ["Pescatarian", "Fish-Based"],
    "Lactose-Free": ["Lactose-Free", "Dairy-Free", "No Dairy"],
    "Gluten-Free": ["Gluten-Free", "No Gluten"]
};

export default function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [selectedDietary, setSelectedDietary] = useState(new Set());
  const [selectedHealth, setSelectedHealth] = useState(new Set());
  const [selectedMealType, setSelectedMealType] = useState(new Set());
  const [selectedCultural, setSelectedCultural] = useState(new Set());
  const [selectedPreferences, setSelectedPreferences] = useState(new Set());

  // Fetch Recipes from Backend
  useEffect(() => {
    fetch("http://localhost:8000/recipes")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Add this detailed logging
          console.log("First few recipes full data:", data.slice(0, 3).map(recipe => ({
            title: recipe.title,
            tags: recipe.tags,
            dietaryPreference: recipe.dietaryPreference,  // Check if it's here
            dietary: recipe.dietary,  // Or here
            healthBenefits: recipe.healthBenefits,
            fullObject: recipe
          })));

          // Also log all unique dietary values in the database
          const allDietary = new Set();
          data.forEach(recipe => {
            if (recipe.tags?.dietary) {
              recipe.tags.dietary.forEach(d => allDietary.add(d));
            }
            if (recipe.dietaryPreference) {
              recipe.dietaryPreference.forEach(d => allDietary.add(d));
            }
          });
          console.log("All dietary values in database:", Array.from(allDietary));
          
          // Log all unique health benefits
          const allHealthBenefits = new Set();
          data.forEach(recipe => {
            (recipe.healthBenefits || []).forEach(benefit => {
              allHealthBenefits.add(benefit);
            });
          });
          console.log("All available health benefits in database:", 
            Array.from(allHealthBenefits).sort());
          
          // Also log a few sample recipes with their benefits
          console.log("Sample recipes with benefits:", 
            data.slice(0, 5).map(recipe => ({
              title: recipe.title,
              benefits: recipe.healthBenefits
            }))
          );
          
          // Log sample of dietary and health data
          console.log("Sample recipe data:", data.slice(0, 3).map(recipe => ({
            title: recipe.title,
            dietary: recipe.dietaryPreference,
            healthBenefits: recipe.healthBenefits,
            rawTags: recipe.tags
          })));
          
          // Log detailed structure of first few recipes
          console.log("First 3 recipes data structure:", data.slice(0, 3).map(recipe => ({
            title: recipe.title,
            rawTags: recipe.tags,
            dietary: recipe.tags?.dietary,
            fullObject: recipe
          })));
          
          setRecipes(data);
          setFilteredRecipes(data);
        } else {
          console.error("Unexpected API response:", data);
          setRecipes([]);
          setFilteredRecipes([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching recipes:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Combined filter and search effect
  useEffect(() => {
    let updatedRecipes = [...recipes];
    
    // Add debug log at start of filtering
    console.log("Starting filtering with recipes:", updatedRecipes.slice(0, 2).map(r => ({
        title: r.title,
        dietary: r.tags?.dietary,
        healthBenefits: r.healthBenefits
    })));

    // Debug current filters
    console.log("Applying filters:", {
        dietary: Array.from(selectedDietary),
        health: Array.from(selectedHealth),
        mealType: Array.from(selectedMealType),
        cultural: Array.from(selectedCultural),
        preferences: Array.from(selectedPreferences)
    });

    // Apply dietary filter
    if (selectedDietary.size > 0) {
        updatedRecipes = updatedRecipes.filter(recipe => {
            // Get dietary preferences from the correct path
            const dietary = recipe.tags?.dietary_preferences || [];
            
            // Debug log with more details
            console.log(`Filtering ${recipe.title}:`, {
                recipeDietary: dietary,
                rawTags: recipe.tags,
                selected: Array.from(selectedDietary)
            });

            return Array.from(selectedDietary).some(selected => {
                const hasMatch = dietary.some(diet => 
                    diet === selected || 
                    (typeof diet === 'string' && diet.toLowerCase() === selected.toLowerCase())
                );
                
                console.log(`Checking ${selected} for ${recipe.title}:`, {
                    hasMatch,
                    recipeDietary: dietary
                });
                
                return hasMatch;
            });
        });
    }

    // Apply health goals filter
    if (selectedHealth.size > 0) {
        updatedRecipes = updatedRecipes.filter(recipe => {
            const healthGoals = recipe.tags?.health_goal || [];
            
            return Array.from(selectedHealth).some(selected => {
                // Check if any health goal's main value matches exactly
                return healthGoals.some(goal => goal.main === selected);
            });
        });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      updatedRecipes = updatedRecipes.filter(recipe => {
        try {
          // Safely get values with strict type checking
          const title = String(recipe.title || '');
          const healthBenefits = recipe.tags?.health_goal?.flatMap(goal => goal.sub || []) || [];
          const mealType = String(recipe.tags?.meal_type || '');
          const culturalMain = String(recipe.tags?.cultural?.main || '');
          const culturalSub = String(recipe.tags?.cultural?.sub || '');
          const dietary = Array.isArray(recipe.tags?.dietary_preferences) ? recipe.tags.dietary_preferences : [];
          const mealPreference = String(recipe.tags?.meal_preference || '');

          // Now perform the search operations
          const titleMatch = title.toLowerCase().includes(query);
          const healthMatch = healthBenefits.some(benefit => 
            String(benefit || '').toLowerCase().includes(query)
          );
          const mealTypeMatch = mealType.toLowerCase().includes(query);
          const culturalMatch = culturalMain.toLowerCase().includes(query) || 
                              culturalSub.toLowerCase().includes(query);
          const dietaryMatch = dietary.some(diet => 
            String(diet || '').toLowerCase().includes(query)
          );
          const preferenceMatch = mealPreference.toLowerCase().includes(query);

          return titleMatch || healthMatch || mealTypeMatch || culturalMatch || dietaryMatch || preferenceMatch;
        } catch (error) {
          console.error('Error processing recipe:', recipe.title, error);
          return false;
        }
      });
    }

    // Apply meal type filter
    if (selectedMealType.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe => {
        const mealType = String(recipe.tags?.meal_type || '');
        return selectedMealType.has(mealType);
      });
    }

    // Apply cultural style filter
    if (selectedCultural.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe => {
        const culturalMain = String(recipe.tags?.cultural?.main || '');
        const style = culturalMain === "Fusion 🥘" ? "Fusion" : "Authentic";
        return selectedCultural.has(style);
      });
    }

    // Apply meal preferences filter
    if (selectedPreferences.size > 0) {
      updatedRecipes = updatedRecipes.filter(recipe => {
        const preference = String(recipe.tags?.meal_preference || '');
        return selectedPreferences.has(preference);
      });
    }

    console.log("Final filtered recipes count:", updatedRecipes.length);
    setFilteredRecipes(updatedRecipes);
  }, [searchQuery, selectedDietary, selectedHealth, selectedMealType, selectedCultural, selectedPreferences, recipes]);

  // Toggle filter functions
  const toggleDietaryFilter = (option) => {
    console.log("Toggling dietary filter:", option); // Debug log
    const newSet = new Set(selectedDietary);
    if (newSet.has(option)) {
      newSet.delete(option);
    } else if (newSet.size < 2) {
      newSet.add(option);
    }
    setSelectedDietary(newSet);
  };

  const toggleHealthFilter = (option) => {
    console.log("Before toggle - selected health:", Array.from(selectedHealth));
    const newSet = new Set(selectedHealth);
    if (newSet.has(option)) {
      newSet.delete(option);
    } else if (newSet.size < 3) {
      newSet.add(option);
    }
    console.log("After toggle - selected health:", Array.from(newSet));
    setSelectedHealth(newSet);
  };

  const toggleMealTypeFilter = (option) => {
    console.log("Toggling meal type filter:", option); // Debug log
    const newSet = new Set(selectedMealType);
    if (newSet.has(option)) {
      newSet.delete(option);
    } else {
      newSet.clear(); // Only allow one meal type
      newSet.add(option);
    }
    setSelectedMealType(newSet);
  };

  const toggleCulturalFilter = (option) => {
    console.log("Toggling cultural filter:", option); // Debug log
    const newSet = new Set(selectedCultural);
    if (newSet.has(option)) {
      newSet.delete(option);
    } else {
      newSet.clear(); // Only allow one cultural style
      newSet.add(option);
    }
    setSelectedCultural(newSet);
  };

  const togglePreferenceFilter = (option) => {
    console.log("Toggling preference filter:", option); // Debug log
    const newSet = new Set(selectedPreferences);
    if (newSet.has(option)) {
      newSet.delete(option);
    } else {
      newSet.clear(); // Only allow one preference
      newSet.add(option);
    }
    setSelectedPreferences(newSet);
  };

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

  if (loading) return <div>Loading recipes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="recipes-page">
      <Navbar />
      <div className="container">
        {/* Sidebar */}
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

            {/* Health Goals */}
            <h3 className="filter-title">Health Goals (Max 3)</h3>
            <div className="filter-group">
              {healthGoals.map((goal) => (
                <button
                  key={goal}
                  className={`filter-button ${selectedHealth.has(goal) ? "selected" : ""}`}
                  onClick={() => toggleHealthFilter(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>

            {/* Meal Types */}
            <h3 className="filter-title">Meal Type</h3>
            <div className="filter-group">
              {mealTypes.map((type) => (
                <button
                  key={type}
                  className={`filter-button ${selectedMealType.has(type) ? "selected" : ""}`}
                  onClick={() => toggleMealTypeFilter(type)}
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
                  onClick={() => toggleCulturalFilter(style)}
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
                  onClick={() => togglePreferenceFilter(pref)}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Recipe Grid */}
        <main className="recipe-list">
          <div className="recipe-list-header">
            <h1>Explore our healthier versions of your favorite South Asian recipes</h1>
            
            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Browse recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="search-icon" size={20} />
            </div>
          </div>

          <div className="recipes-grid">
            {filteredRecipes.map((recipe, index) => (
              <RecipeCard 
                key={index} 
                {...recipe} 
                culturalStyle={recipe.tags?.cultural?.main === "Fusion 🥘" ? 
                  "Fusion 🥘" : 
                  recipe.tags?.cultural?.sub || ''}
                isFavorite={favorites.has(recipe.title)} 
                onFavoriteToggle={() => toggleFavorite(recipe.title)} 
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
