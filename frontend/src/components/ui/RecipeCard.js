import React from "react";
import { Heart, Clock, DollarSign } from "lucide-react";
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
  spiceLevel 
}) {
  return (
    <Card className="recipe-card">
      <div className="relative">
      <img 
  src={image} 
  alt={title} 
  className="recipe-image" 
  onError={(e) => e.target.style.display = 'none'} 
/>


        <button className="favorite-button" onClick={onFavoriteToggle}>
          <Heart className={`heart ${isFavorite ? "filled" : ""}`} />
        </button>
      </div>

      <div className="recipe-content">
        <h3 className="recipe-title">{title}</h3>

        {/* Time, Price, Chili, and Cultural Style in One Row */}
        <div className="recipe-details">
          <div className="recipe-info">
            <Clock className="icon" /> {timeInMinutes}m
            <DollarSign className="icon" /> £{pricePerPortion}
            <span className="spice-level">
              {Array(spiceLevel).fill(0).map((_, i) => (
                <span key={i} className="chili">🌶️</span>
              ))}
            </span>
            <Badge className="cultural-style">{culturalStyle}</Badge>
          </div>
        </div>

        {/* Aligned Nutrition Information */}
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

        {/* Health Benefits - More Space Between Items */}
        <div className="recipe-tags">
          {healthBenefits.map((benefit, index) => (
            <Badge key={index} className="health-badge">{benefit}</Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default RecipeCard;
