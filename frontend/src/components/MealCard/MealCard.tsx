import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronRight, Trash2 } from "lucide-react";
import "./MealCard.css";

// Types
interface MacroProgress {
  current: number;
  goal: number;
  label: string;
  unit: string;
  color: string;
}

interface HealthScore {
  score: number;
  label: string;
  info: string;
  colorScale: "lowGood" | "highGood";
}

interface Supplement {
  name: string;
  dose: string;
  notes?: string;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  image: string;
  tags: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  healthScores: {
    glycemic: number;
    inflammatory: number;
    heart: number;
    digestive: number;
    balance: number;
  };
}

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

export function MealCard({ meal, onDelete, expanded = false, onToggle }: MealCardProps) {
  const getHealthScoreClass = (score: number, type: "lowGood" | "highGood"): string => {
    if (type === "lowGood") {
      if (score <= 33) return "good";
      if (score <= 66) return "warning";
      return "poor";
    } else {
      if (score >= 67) return "good";
      if (score >= 34) return "warning";
      return "poor";
    }
  };

  const totalMacros = meal.macros.protein + meal.macros.carbs + meal.macros.fats;
  const proteinPercentage = Math.round((meal.macros.protein / totalMacros) * 100);
  const carbsPercentage = Math.round((meal.macros.carbs / totalMacros) * 100);
  const fatsPercentage = Math.round((meal.macros.fats / totalMacros) * 100);

  return (
    <div className="meal-card">
      <div className="meal-card-header">
        <div className="meal-card-content">
          <div className="meal-card-image">
            <img src={meal.image} alt={meal.name} />
          </div>
          <div className="meal-card-info">
            <div className="meal-card-header-row">
              <h3 className="meal-card-title">{meal.name}</h3>
              <span className="meal-card-time">{meal.time}</span>
            </div>
            <div className="meal-card-tags">
              {meal.tags.map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="meal-card-tag"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggle} 
          className="w-full mt-2 text-muted-foreground"
        >
          {expanded ? "Hide Details" : "View Insights"}
          <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </Button>
      </div>

      <div className={`meal-card-details ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="meal-card-details-content">
          <div className="meal-card-section">
            <h4 className="meal-card-section-title">Nutrition</h4>
            <div className="meal-card-nutrition-grid">
              <div className="meal-card-nutrition-item">
                <span>Calories:</span>
                <span>{meal.macros.calories}kcal</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Protein:</span>
                <span>{meal.macros.protein}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Carbs:</span>
                <span>{meal.macros.carbs}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Fats:</span>
                <span>{meal.macros.fats}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Fiber:</span>
                <span>{meal.macros.fiber}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Sugar:</span>
                <span>{meal.macros.sugar}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Sodium:</span>
                <span>{meal.macros.sodium}mg</span>
              </div>
            </div>
          </div>

          <div className="meal-card-section">
            <h4 className="meal-card-section-title">Meal Balance</h4>
            <div className="meal-card-balance">
              <div className="meal-card-balance-bar">
                <div 
                  className="meal-card-balance-protein"
                  style={{ width: `${proteinPercentage}%` }}
                />
                <div 
                  className="meal-card-balance-carbs"
                  style={{ 
                    left: `${proteinPercentage}%`,
                    width: `${carbsPercentage}%` 
                  }}
                />
                <div 
                  className="meal-card-balance-fats"
                  style={{ 
                    left: `${proteinPercentage + carbsPercentage}%`,
                    width: `${fatsPercentage}%` 
                  }}
                />
              </div>
              <div className="meal-card-balance-labels">
                <span>Protein {proteinPercentage}%</span>
                <span>Carbs {carbsPercentage}%</span>
                <span>Fats {fatsPercentage}%</span>
              </div>
            </div>
          </div>

          <div className="meal-card-section">
            <h4 className="meal-card-section-title">Health Scores</h4>
            <div className="meal-card-health-scores">
              {Object.entries(meal.healthScores).map(([key, value]) => (
                <div key={key} className="meal-card-health-score">
                  <div className="meal-card-health-score-header">
                    <span className="meal-card-health-score-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>
                  </div>
                  <div className="meal-card-health-score-bar">
                    <div 
                      className={`meal-card-health-score-progress ${getHealthScoreClass(value, key === 'glycemic' || key === 'inflammatory' ? 'lowGood' : 'highGood')}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="meal-card-actions">
            <Button 
              variant="ghost"
              size="sm"
              className="meal-card-delete-button"
              onClick={() => onDelete(meal.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Meal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 