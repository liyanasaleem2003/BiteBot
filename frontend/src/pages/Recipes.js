import React, { useState, useEffect } from "react";
import { RecipeCard } from "../components/ui/RecipeCard";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import { Search } from "lucide-react";
import { useFavoriteRecipes } from "../context/FavoriteRecipesContext";
import "./Recipes.css";
import { API_BASE_URL } from '../config';

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
  const [searchQuery, setSearchQuery] = useState("");
  const { isFavorite, addFavoriteRecipe, removeFavoriteRecipe } = useFavoriteRecipes();

  // Filter states
  const [selectedDietary, setSelectedDietary] = useState(new Set());
  const [selectedHealth, setSelectedHealth] = useState(new Set());
  const [selectedMealType, setSelectedMealType] = useState(new Set());
  const [selectedCultural, setSelectedCultural] = useState(new Set());
  const [selectedPreferences, setSelectedPreferences] = useState(new Set());

  // Fetch Recipes from Backend
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch all recipes
        const recipesResponse = await fetch(`${API_BASE_URL}/api/recipes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
        });

        if (!recipesResponse.ok) {
          throw new Error(`HTTP error! Status: ${recipesResponse.status}`);
        }

        const recipesData = await recipesResponse.json();
        
        // Then fetch saved recipes
        const savedResponse = await fetch(`${API_BASE_URL}/api/saved/recipes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
        });

        if (!savedResponse.ok) {
          throw new Error(`HTTP error! Status: ${savedResponse.status}`);
        }

        const savedData = await savedResponse.json();
        
        // Combine the data
        const allRecipes = recipesData.map(recipe => ({
          ...recipe,
          isSaved: savedData.some(saved => saved.recipe_id === recipe.recipe_id)
        }));
        
        if (Array.isArray(allRecipes)) {
          console.log("Received recipes data:", allRecipes);
          setRecipes(allRecipes);
          setFilteredRecipes(allRecipes);
        } else {
          console.error("Unexpected API response:", allRecipes);
          setRecipes([]);
          setFilteredRecipes([]);
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
        setError(error.message);
        setRecipes([]);
        setFilteredRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
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

  // Updated Toggle Favorite Function
  const toggleFavorite = (recipe) => {
    // Check if the recipe is already a favorite
    const isCurrentlyFavorite = isFavorite(recipe.recipe_id);
    
    if (isCurrentlyFavorite) {
      // If it's already a favorite, remove it
      removeFavoriteRecipe(recipe.recipe_id);
      console.log(`Removed recipe ${recipe.recipe_id} from favorites`);
    } else {
      // If it's not a favorite, add it
      // Ensure recipe has a valid recipe_id before adding
      if (!recipe.recipe_id) {
        console.error('Cannot add recipe to favorites: recipe_id is missing', recipe);
        return;
      }
      
      addFavoriteRecipe(recipe);
      console.log(`Added recipe ${recipe.recipe_id} to favorites`);
    }
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
            {filteredRecipes.map((recipe, index) => {
              // Log the recipe object for debugging
              console.log(`Rendering recipe ${index}:`, recipe);
              
              return (
                <RecipeCard 
                  key={index} 
                  {...recipe} 
                  culturalStyle={recipe.tags?.cultural?.main === "Fusion 🥘" ? 
                    "Fusion 🥘" : 
                    recipe.tags?.cultural?.sub || ''}
                  isFavorite={isFavorite(recipe.recipe_id)} 
                  onFavoriteToggle={() => toggleFavorite(recipe)} 
                  location="recipes"
                />
              );
            })}
          </div>
        </main>
      </div>

      {/* Grocery Stores Section */}
      <div className="grocery-stores-bar">
        <h3>Find your Desi Groceries Online at:</h3>
        <div className="grocery-stores-links">
          <a href="https://desicart.co.uk/" target="_blank" rel="noopener noreferrer">Desicart</a>
          <a href="https://www.lakshmistores.com/" target="_blank" rel="noopener noreferrer">Lakshmi Stores</a>
          <a href="https://veenas.com/" target="_blank" rel="noopener noreferrer">Veenas</a>
          <a href="https://itsconv.co.uk/" target="_blank" rel="noopener noreferrer">Its Convenience</a>
          <a href="https://banglasupermarket.co.uk/" target="_blank" rel="noopener noreferrer">Bangla Supermarket</a>
          <a href="https://myjam.co.uk/collections/indian-pakistani-grocery" target="_blank" rel="noopener noreferrer">MyJam</a>
          <a href="https://happiroo.co.uk/" target="_blank" rel="noopener noreferrer">Happiroo</a>
          <a href="https://zingoxfoods.co.uk/collections/nationwide-delivery/pakistani-grocery-uk" target="_blank" rel="noopener noreferrer">Zingox Foods</a>
          <a href="https://www.thehalalfoodshop.com/" target="_blank" rel="noopener noreferrer">The Halal Food Shop</a>
          <a href="https://greenoranges.co.uk/" target="_blank" rel="noopener noreferrer">Green Oranges</a>
          <a href="https://www.masalabazaar.co.uk/" target="_blank" rel="noopener noreferrer">Masala Bazaar</a>
          <a href="https://www.redrickshaw.com/" target="_blank" rel="noopener noreferrer">Red Rickshaw</a>
          <a href="https://bombaybasket.co.uk/" target="_blank" rel="noopener noreferrer">Bombay Basket</a>
        </div>
      </div>
    </div>
  );
}
