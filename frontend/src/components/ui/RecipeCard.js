import React, { useState } from "react";
import { Heart, Clock, DollarSign, ArrowRight, X } from "lucide-react";
import "./RecipeCard.css";

const Card = ({ children, className }) => (
  <div className={`border rounded-lg shadow p-4 bg-black/40 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-all ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className }) => (
  <span className={`px-3 py-1 rounded text-xs font-semibold ${className}`}>
    {children}
  </span>
);

export function RecipeCard({ 
  title, 
  image, 
  timeInMinutes, 
  pricePerPortion, 
  nutrition, 
  healthBenefits,
  culturalStyle, 
  isFavorite, 
  onFavoriteToggle, 
  spiceLevel,
  introduction,
  ingredients,
  instructions,
  tags 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Card className={`recipe-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="recipe-image-container">
          <img 
            src={image} 
            alt={title} 
            className="recipe-image" 
            onError={(e) => e.target.style.display = 'none'} 
          />
          <div className="recipe-image-overlay">
            <button 
              className="view-recipe-button"
              onClick={() => setIsExpanded(true)}
            >
              View Recipe <ArrowRight size={16} />
            </button>
          </div>
          <button className="favorite-button" onClick={onFavoriteToggle}>
            <Heart className={`heart ${isFavorite ? "filled" : ""}`} />
          </button>
        </div>

        <div className="recipe-content">
          <h3 className="recipe-title">{title}</h3>

          <div className="recipe-details">
            <div className="recipe-info">
              <Clock className="icon" /> {timeInMinutes}m
              <span><span className="pound-sign">£</span> {pricePerPortion}</span>
              <span className="spice-level">
                {Array(spiceLevel).fill(0).map((_, i) => (
                  <span key={i} className="chili">🌶️</span>
                ))}
              </span>
              <Badge className="cultural-style">{culturalStyle}</Badge>
            </div>
          </div>

          <div className="nutrition-info">
            <div className="nutrition-left">
              <p><strong>Calories:</strong> {nutrition.calories}</p>
              <p><strong>Carbs:</strong> {nutrition.carbs}g</p>
              <p><strong>Fiber:</strong> {nutrition.fiber}g</p>
            </div>
            <div className="nutrition-right">
              <p><strong>Protein:</strong> {nutrition.protein}g</p>
              <p><strong>Fat:</strong> {nutrition.fat}g</p>
              <p className="portion-info">*Per Portion*</p>
            </div>
          </div>

          <div className="recipe-tags">
            {healthBenefits.map((benefit, index) => (
              <Badge key={index} className="health-badge">{benefit}</Badge>
            ))}
          </div>
        </div>
      </Card>

      {isExpanded && (
        <div className="recipe-expanded-overlay">
          <div className="recipe-expanded-content">
            <button 
              className="close-button"
              onClick={() => setIsExpanded(false)}
            >
              <X size={24} />
            </button>
            
            <h2>{title}</h2>

            <div className="recipe-section">
              <h3>Introduction</h3>
              <p>{introduction}</p>
            </div>

            <div className="recipe-section recipe-quick-info">
              <div className="quick-info-item">
                <Clock className="icon" /> 
                <span>Time: {timeInMinutes} minutes</span>
              </div>
              <div className="quick-info-item">
                <span>Price: <span className="pound-sign">£</span> {pricePerPortion} per portion</span>
              </div>
              <div className="quick-info-item">
                <span>Spice Level: {Array(spiceLevel).fill("🌶️").join(" ")}</span>
              </div>
            </div>

            <div className="recipe-section recipe-categories">
              <h3>Recipe Categories</h3>
              <div className="categories-grid">
                <div className="category-item">
                  <h4>Dietary Preferences</h4>
                  <div className="tags-container">
                    {tags?.dietary_preferences?.map((pref, index) => (
                      <Badge key={index} className="dietary-badge">{pref}</Badge>
                    ))}
                  </div>
                </div>
                <div className="category-item">
                  <h4>Health Goals</h4>
                  <div className="tags-container">
                    {tags?.health_goal?.map((goal, index) => (
                      <div key={index} className="health-goal-item">
                        <span className="health-goal-main">{goal.main}</span>
                        {goal.sub?.map((sub, subIndex) => (
                          <Badge key={subIndex} className="health-badge">{sub}</Badge>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="category-item">
                  <h4>Cultural Style</h4>
                  <div className="tags-container">
                    <Badge className="cultural-badge">
                      {tags?.cultural?.main} - {tags?.cultural?.sub}
                    </Badge>
                  </div>
                </div>
                <div className="category-item">
                  <h4>Meal Type</h4>
                  <div className="tags-container">
                    <Badge className="meal-type-badge">
                      {typeof tags?.meal_type === 'string' 
                        ? tags.meal_type
                            .replace(/([A-Z])/g, ' $1')
                            .trim()
                            .replace(/([a-z])([A-Z])/g, '$1 / $2')
                        : tags?.meal_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="recipe-section nutrition-section">
              <h3>Nutritional Information</h3>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Calories</span>
                  <span className="nutrition-value">{nutrition.calories}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein</span>
                  <span className="nutrition-value">{nutrition.protein}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs</span>
                  <span className="nutrition-value">{nutrition.carbs}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fat</span>
                  <span className="nutrition-value">{nutrition.fat}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fiber</span>
                  <span className="nutrition-value">{nutrition.fiber}g</span>
                </div>
              </div>
            </div>
            
            <div className="recipe-section">
              <h3>Ingredients</h3>
              <div className="ingredients-table">
                <div className="ingredients-header">
                  <span>Ingredient</span>
                  <span>Quantity</span>
                </div>
                {ingredients?.map((ingredient, index) => (
                  <div key={index} className="ingredient-row">
                    <span className="ingredient-name">{ingredient.name}</span>
                    <span className="ingredient-quantity">{ingredient.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="recipe-section">
              <h3>Instructions</h3>
              <ol className="instructions-list">
                {instructions?.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RecipeCard;
