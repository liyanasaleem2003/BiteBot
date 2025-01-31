import React, { useState, useEffect } from "react";
import "./Recipes.css";


const Recipe = () => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [filters, setFilters] = useState({
    dietaryPreferences: [],
    healthGoals: [],
    mealType: "",
    culturalStyle: "",
    mealPreferences: [],
  });

  useEffect(() => {
  fetch("http://localhost:8000/recipes")
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched recipes:", data); // Debugging log
      setRecipes(data);
      setFilteredRecipes(data);
    })
    .catch((error) => console.error("Error fetching recipes:", error));
}, []);


  // Handle filter selection
  const toggleFilter = (filterCategory, filterValue) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };
      if (filterCategory === "mealType" || filterCategory === "culturalStyle") {
        updatedFilters[filterCategory] = filterValue;
      } else {
        const selected = updatedFilters[filterCategory];
        if (selected.includes(filterValue)) {
          updatedFilters[filterCategory] = selected.filter(
            (item) => item !== filterValue
          );
        } else if (
          (filterCategory === "dietaryPreferences" && selected.length < 2) ||
          (filterCategory === "healthGoals" && selected.length < 3)
        ) {
          updatedFilters[filterCategory] = [...selected, filterValue];
        }
      }
      return updatedFilters;
    });
  };

  // Filter recipes based on selected filters
  useEffect(() => {
    const filterRecipes = () => {
      let results = recipes;

      if (filters.dietaryPreferences.length > 0) {
        results = results.filter((recipe) =>
          filters.dietaryPreferences.every((pref) =>
            recipe.tags.dietary_preferences.includes(pref)
          )
        );
      }

      if (filters.healthGoals.length > 0) {
        results = results.filter((recipe) =>
          filters.healthGoals.every((goal) =>
            recipe.tags.health_goal.some((hg) =>
              hg.sub.some((subGoal) => subGoal === goal)
            )
          )
        );
      }

      if (filters.mealType) {
        results = results.filter(
          (recipe) => recipe.tags.meal_type === filters.mealType
        );
      }

      if (filters.culturalStyle) {
        results = results.filter(
          (recipe) => recipe.tags.cultural.main === filters.culturalStyle
        );
      }

      setFilteredRecipes(results);
    };

    filterRecipes();
  }, [filters, recipes]);

  return (
    <div className="recipe-page">
      <div className="filter-recipes">
        <h2>Filter Recipes</h2>
        {/* Dietary Preferences */}
        <h3>Dietary Preferences (Up to 2)</h3>
        {["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Lactose-Free", "Gluten-Free"].map((pref) => (
          <button
            key={pref}
            className={`filter-button ${
              filters.dietaryPreferences.includes(pref) ? "selected" : ""
            }`}
            onClick={() => toggleFilter("dietaryPreferences", pref)}
          >
            {pref}
          </button>
        ))}

        {/* Health Goals */}
        <h3>Health Goals (Up to 3)</h3>
        {[
          "Low-Sugar",
          "High-Protein",
          "Heart-Healthy",
          "Digestive Health",
          "Iron & Folate Rich",
          "Immunity Boosting",
          "Skin & Joint Health",
        ].map((goal) => (
          <button
            key={goal}
            className={`filter-button ${
              filters.healthGoals.includes(goal) ? "selected" : ""
            }`}
            onClick={() => toggleFilter("healthGoals", goal)}
          >
            {goal}
          </button>
        ))}

        {/* Meal Type */}
        <h3>Meal Type</h3>
        {["Breakfast", "Snacks/In-Between Meals", "Lunch", "Desserts/Sweet Treats", "Dinner"].map(
          (meal) => (
            <button
              key={meal}
              className={`filter-button ${
                filters.mealType === meal ? "selected" : ""
              }`}
              onClick={() => toggleFilter("mealType", meal)}
            >
              {meal}
            </button>
          )
        )}

        {/* Cultural Style */}
        <h3>Cultural Style</h3>
        {["Authentic", "Fusion"].map((style) => (
          <button
            key={style}
            className={`filter-button ${
              filters.culturalStyle === style ? "selected" : ""
            }`}
            onClick={() => toggleFilter("culturalStyle", style)}
          >
            {style}
          </button>
        ))}

        {/* Meal Preferences */}
        <h3>Meal Preferences</h3>
        {["Quick-to-Prepare", "Meal-Prep Friendly", "Family-Friendly"].map(
          (pref) => (
            <button
              key={pref}
              className={`filter-button ${
                filters.mealPreferences.includes(pref) ? "selected" : ""
              }`}
              onClick={() => toggleFilter("mealPreferences", pref)}
            >
              {pref}
            </button>
          )
        )}
      </div>

      <div className="recipe-list">
        <h2>Explore our healthier versions of your favorite South Asian recipes</h2>
        <div className="recipes-grid">
          {filteredRecipes.map((recipe) => (
            <div className="recipe-card" key={recipe.recipe_id}>
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="recipe-image"
              />
              <h3>{recipe.name}</h3>
              <p>⏱️ {recipe.time_required} mins 🌶️ {recipe.spice_level} 
              💰 £{recipe.approx_price_per_portion} per portion</p>
              <div className="tags">
                <p>{recipe.tags.cultural.main}</p>
                <p>
                  {recipe.tags.health_goal
                    .flatMap((goal) => goal.sub)
                    .join(", ")}
                </p>
              </div>
              <button className="favorite-button">❤️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recipe;
