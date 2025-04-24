import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const FavoriteRecipesContext = createContext();

export function FavoriteRecipesProvider({ children }) {
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch saved recipes from backend on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSavedRecipes();
    } else {
      // Clear state when no token (logged out)
      setFavoriteRecipes([]);
      setLoading(false);
      setError(null);
    }
  }, [localStorage.getItem('token')]); // Re-run when token changes

  const fetchSavedRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? `${token.substring(0, 10)}...` : 'No token found');
      
      if (!token) {
        console.error('No authentication token found');
        setFavoriteRecipes([]);
        setLoading(false);
        return;
      }

      // Remove 'Bearer ' prefix if it exists
      const cleanToken = token.replace('Bearer ', '');
      console.log('Cleaned token:', cleanToken ? `${cleanToken.substring(0, 10)}...` : 'No token after cleaning');

      // Log user ID from token for debugging
      try {
        const tokenParts = cleanToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('User ID from token:', payload.sub);
        } else {
          console.log('Token does not appear to be a valid JWT format');
        }
      } catch (e) {
        console.error('Error parsing token payload:', e);
      }

      const response = await fetch(`${API_BASE_URL}/api/saved/recipes`, {
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          setFavoriteRecipes([]);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch saved recipes');
      }

      const data = await response.json();
      setFavoriteRecipes(data);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      setError(error.message);
      setFavoriteRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const addFavoriteRecipe = async (recipe) => {
    try {
      console.log('=== ADDING FAVORITE RECIPE ===');
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? `${token.substring(0, 10)}...` : 'No token found');
      
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }

      // Remove 'Bearer ' prefix if it exists
      const cleanToken = token.replace('Bearer ', '');
      console.log('Cleaned token:', cleanToken ? `${cleanToken.substring(0, 10)}...` : 'No token after cleaning');

      // Log user ID from token for debugging
      try {
        const tokenParts = cleanToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('User ID from token:', payload.sub);
        } else {
          console.log('Token does not appear to be a valid JWT format');
        }
      } catch (e) {
        console.error('Error parsing token payload:', e);
      }

      // Ensure recipe has a recipe_id field
      if (!recipe.recipe_id) {
        console.error('Recipe missing recipe_id field');
        throw new Error('Recipe missing recipe_id field');
      }

      // Check if recipe already exists in state
      const existingRecipe = favoriteRecipes.find(r => r.recipe_id === recipe.recipe_id);
      if (existingRecipe) {
        console.log(`Recipe ${recipe.recipe_id} already exists in favorites`);
        return existingRecipe;
      }

      // Check if recipe exists in database
      const checkResponse = await fetch(`${API_BASE_URL}/api/saved/recipes/${recipe.recipe_id}`, {
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json"
        }
      });

      if (checkResponse.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }

      if (checkResponse.ok) {
        console.log(`Recipe ${recipe.recipe_id} already exists in database`);
        const existingRecipe = await checkResponse.json();
        return existingRecipe;
      }

      // Save recipe to database
      const response = await fetch(`${API_BASE_URL}/api/saved/recipes`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(recipe)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const savedRecipe = await response.json();
      console.log('Recipe saved successfully:', savedRecipe);

      // Update state with new recipe
      setFavoriteRecipes(prev => [...prev, savedRecipe]);
      return savedRecipe;
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError(error.message);
      throw error;
    }
  };

  const removeFavoriteRecipe = async (recipeId) => {
    try {
      console.log('=== REMOVING FAVORITE RECIPE ===');
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? `${token.substring(0, 10)}...` : 'No token found');
      
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }

      // Remove 'Bearer ' prefix if it exists
      const cleanToken = token.replace('Bearer ', '');
      console.log('Cleaned token:', cleanToken ? `${cleanToken.substring(0, 10)}...` : 'No token after cleaning');

      // Log user ID from token for debugging
      try {
        const tokenParts = cleanToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('User ID from token:', payload.sub);
        } else {
          console.log('Token does not appear to be a valid JWT format');
        }
      } catch (e) {
        console.error('Error parsing token payload:', e);
      }

      const response = await fetch(`${API_BASE_URL}/api/saved/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log(`Recipe ${recipeId} removed successfully`);

      // Update state by removing the recipe
      setFavoriteRecipes(prev => prev.filter(recipe => recipe.recipe_id !== recipeId));
    } catch (error) {
      console.error('Error removing recipe:', error);
      setError(error.message);
      throw error;
    }
  };

  const isFavorite = (recipeId) => {
    // Check if recipeId is undefined or null
    if (!recipeId) {
      console.error('isFavorite called with undefined or null recipeId');
      return false;
    }
    
    // Check if the recipe exists in the favoriteRecipes state
    const exists = favoriteRecipes.some(recipe => recipe.recipe_id === recipeId);
    console.log(`Checking if recipe ${recipeId} is favorite: ${exists}`);
    return exists;
  };

  return (
    <FavoriteRecipesContext.Provider value={{
      favoriteRecipes,
      loading,
      error,
      addFavoriteRecipe,
      removeFavoriteRecipe,
      isFavorite
    }}>
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

export default FavoriteRecipesContext; 