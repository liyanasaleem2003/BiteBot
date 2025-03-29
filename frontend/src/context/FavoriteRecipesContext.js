import React, { createContext, useState, useContext, useEffect } from 'react';

const FavoriteRecipesContext = createContext();

export function FavoriteRecipesProvider({ children }) {
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteRecipes');
    if (savedFavorites) {
      setFavoriteRecipes(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favoriteRecipes', JSON.stringify(favoriteRecipes));
  }, [favoriteRecipes]);

  const addFavoriteRecipe = (recipe) => {
    setFavoriteRecipes(prev => {
      // Check if recipe already exists
      if (!prev.some(r => r.title === recipe.title)) {
        return [...prev, recipe];
      }
      return prev;
    });
  };

  const removeFavoriteRecipe = (recipeTitle) => {
    setFavoriteRecipes(prev => prev.filter(recipe => recipe.title !== recipeTitle));
  };

  const isFavorite = (recipeTitle) => {
    return favoriteRecipes.some(recipe => recipe.title === recipeTitle);
  };

  return (
    <FavoriteRecipesContext.Provider 
      value={{ 
        favoriteRecipes, 
        addFavoriteRecipe, 
        removeFavoriteRecipe,
        isFavorite
      }}
    >
      {children}
    </FavoriteRecipesContext.Provider>
  );
}

export function useFavoriteRecipes() {
  const context = useContext(FavoriteRecipesContext);
  if (!context) {
    throw new Error('useFavoriteRecipes must be used within a FavoriteRecipesProvider');
  }
  return context;
} 