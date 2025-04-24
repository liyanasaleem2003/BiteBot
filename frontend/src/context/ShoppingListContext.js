import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const ShoppingListContext = createContext();

export function ShoppingListProvider({ children }) {
  const [ingredients, setIngredients] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch shopping list when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchShoppingList();
    } else {
      // Clear shopping list when no token (logged out)
      setIngredients([]);
      setIsLoading(false);
      setError(null);
    }
  }, [localStorage.getItem('token')]); // Re-run when token changes

  const fetchShoppingList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setIngredients([]);
        setIsLoading(false);
        return;
      }

      // Remove Bearer prefix if it exists
      const cleanToken = token.replace('Bearer ', '');

      const response = await fetch(`${API_BASE_URL}/api/shopping-list`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          setIngredients([]);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch shopping list');
      }
      
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      setError(error.message);
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredients = async (newIngredients) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const updatedIngredients = [...ingredients, ...newIngredients];
      
      const response = await fetch(`${API_BASE_URL}/api/shopping-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.replace('Bearer ', '')}`
        },
        body: JSON.stringify({ ingredients: updatedIngredients })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setIngredients([]);
          return;
        }
        throw new Error('Failed to update shopping list');
      }

      const data = await response.json();
      setIngredients(data.ingredients);
    } catch (error) {
      console.error('Error updating shopping list:', error);
      setError(error.message);
    }
  };

  const removeIngredient = async (index) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const updatedIngredients = ingredients.filter((_, i) => i !== index);
      
      const response = await fetch(`${API_BASE_URL}/api/shopping-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.replace('Bearer ', '')}`
        },
        body: JSON.stringify({ ingredients: updatedIngredients })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setIngredients([]);
          return;
        }
        throw new Error('Failed to update shopping list');
      }

      const data = await response.json();
      setIngredients(data.ingredients);
    } catch (error) {
      console.error('Error removing ingredient:', error);
      setError(error.message);
    }
  };

  const clearIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/shopping-list`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.replace('Bearer ', '')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setIngredients([]);
          return;
        }
        if (response.status === 404) {
          // If user not found, just clear the local state
          setIngredients([]);
          return;
        }
        throw new Error('Failed to clear shopping list');
      }

      setIngredients([]);
    } catch (error) {
      console.error('Error clearing shopping list:', error);
      setError(error.message);
      // Even if the server request fails, clear the local state
      setIngredients([]);
    }
  };

  const toggleShoppingList = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <ShoppingListContext.Provider value={{
      ingredients,
      isOpen,
      isLoading,
      error,
      addIngredients,
      removeIngredient,
      clearIngredients,
      toggleShoppingList
    }}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
} 