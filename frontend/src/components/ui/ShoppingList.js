import React, { useState } from 'react';
import { ShoppingCart, X, Trash2, Plus, Download } from 'lucide-react';
import { useShoppingList } from '../../context/ShoppingListContext';
import './ShoppingList.css';

export default function ShoppingList() {
  const { ingredients, isOpen, isLoading, toggleShoppingList, clearIngredients, addIngredients, removeIngredient } = useShoppingList();
  const [newIngredient, setNewIngredient] = useState('');

  if (isLoading) {
    return (
      <div className="shopping-list-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (newIngredient.trim()) {
      addIngredients([newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleSaveToDevice = () => {
    const text = ingredients.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="shopping-list-container">
      <button className="shopping-cart-button" onClick={toggleShoppingList}>
        <ShoppingCart className="icon" />
        <span>{ingredients.length}</span>
      </button>

      {isOpen && (
        <div className="shopping-list-panel">
          <div className="shopping-list-header">
            <h2>Shopping List</h2>
            <button className="close-button" onClick={toggleShoppingList}>
              <X size={20} />
            </button>
          </div>
          
          <div className="shopping-list-content">
            <form onSubmit={handleAddIngredient} className="add-ingredient-form">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add new ingredient..."
                className="add-ingredient-input"
              />
              <button type="submit" className="add-ingredient-button">
                <Plus size={16} />
              </button>
            </form>

            {ingredients.length === 0 ? (
              <p className="empty-list">Your shopping list is empty</p>
            ) : (
              <ul className="ingredients-list">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="ingredient-item">
                    <span>{ingredient}</span>
                    <button 
                      className="delete-ingredient-button"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {ingredients.length > 0 && (
            <div className="shopping-list-footer">
              <button className="save-button" onClick={handleSaveToDevice}>
                <Download size={16} />
                Save to Device
              </button>
              <button className="clear-button" onClick={clearIngredients}>
                Clear List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 