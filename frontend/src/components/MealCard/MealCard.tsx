import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, Trash2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { API_BASE_URL } from '../../config';
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
  micronutrient_balance?: {
    score: number;
    priority_nutrients: Array<{
      name: string;
      percentage: number;
    }>;
  };
}

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

const healthScoreInfo = {
  glycemic: {
    label: "Glycemic Index",
    description: "Measures how quickly foods raise blood sugar levels. Lower scores are better for stable energy."
  },
  inflammatory: {
    label: "Inflammatory Score",
    description: "Indicates how likely foods are to cause inflammation. Lower scores mean less inflammatory."
  },
  heart: {
    label: "Heart Health Score",
    description: "Evaluates food impact on cardiovascular health. Higher scores are better for heart health."
  },
  digestive: {
    label: "Digestive Score",
    description: "Rates how easy foods are to digest and their effect on gut health. Higher scores indicate better digestive support."
  },
  balance: {
    label: "Meal Balance Score",
    description: "Measures overall nutritional balance across all food groups. Higher scores indicate better balanced meals."
  }
};

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

  const formatScoreLabel = (key: string): string => {
    return key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() + key.slice(1);
  };

  // Helper function to get the full image URL
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath || imagePath.trim() === '') {
      return "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80";
    }
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${API_BASE_URL}${imagePath}`;
  };

  return (
    <div className="meal-card">
      <div className="meal-card-header">
        <div className="meal-card-content">
          <div className="meal-card-image">
            <img 
              src={getImageUrl(meal.image)}
              alt={meal.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-meal.jpg";
                console.error("Failed to load image:", meal.image);
              }}
            />
          </div>
          <div className="meal-card-info">
            <div className="meal-card-header-row">
              <div className="meal-card-title-container">
                <div className="flex items-center justify-between w-full">
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
            <button 
              className="meal-card-view-button"
              onClick={onToggle}
            >
              {expanded ? "Hide Details" : "View Insights"}
              <ChevronDown 
                className={`ml-2 h-4 w-4 chevron ${expanded ? 'expanded' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {!expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(meal.id);
          }}
          className="meal-card-delete-button text-zinc-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

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
            <div className="flex items-center justify-between mb-4">
              <h4 className="meal-card-section-title">Health Scores</h4>
              <TooltipProvider>
                <Tooltip content={
                  <div className="meal-card-health-score-tooltip">
                    These scores are calculated based on your food intake and provide a holistic view of your nutritional health.
                  </div>
                }>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-zinc-400 cursor-help" />
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="meal-card-health-scores">
              {Object.entries(meal.healthScores).map(([key, value]) => (
                <div key={key} className="meal-card-health-score">
                  <div className="meal-card-health-score-header">
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip content={
                          <div className="meal-card-health-score-tooltip">
                            {healthScoreInfo[key as keyof typeof healthScoreInfo].description}
                          </div>
                        }>
                          <TooltipTrigger asChild>
                            <div className="meal-card-health-score-label">
                              <span>{healthScoreInfo[key as keyof typeof healthScoreInfo].label}</span>
                              <HelpCircle className="help-icon" />
                            </div>
                          </TooltipTrigger>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-sm text-zinc-400">{Math.round(value)}%</span>
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

          {meal.micronutrient_balance && (
            <div className="meal-card-section">
              <div className="flex items-center justify-between mb-4">
                <h4 className="meal-card-section-title">Micronutrient Balance</h4>
                <TooltipProvider>
                  <Tooltip content={
                    <div className="meal-card-health-score-tooltip">
                      Shows the average percentage of daily recommended intake for your priority micronutrients.
                    </div>
                  }>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-zinc-400 cursor-help" />
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="meal-card-health-scores">
                <div className="meal-card-health-score">
                  <div className="meal-card-health-score-header">
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip content={
                          <div className="meal-card-health-score-tooltip">
                            Average percentage of daily recommended intake for your priority micronutrients.
                          </div>
                        }>
                          <TooltipTrigger asChild>
                            <div className="meal-card-health-score-label">
                              <span>Overall Balance</span>
                              <HelpCircle className="help-icon" />
                            </div>
                          </TooltipTrigger>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-sm text-zinc-400">{Math.round(meal.micronutrient_balance.score)}%</span>
                  </div>
                  <div className="meal-card-health-score-bar">
                    <div 
                      className={`meal-card-health-score-progress ${getHealthScoreClass(meal.micronutrient_balance.score, 'highGood')}`}
                      style={{ width: `${meal.micronutrient_balance.score}%` }}
                    />
                  </div>
                </div>
                {meal.micronutrient_balance.priority_nutrients.map((nutrient, index) => (
                  <div key={index} className="meal-card-health-score">
                    <div className="meal-card-health-score-header">
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip content={
                            <div className="meal-card-health-score-tooltip">
                              Percentage of daily recommended intake for {nutrient.name}.
                            </div>
                          }>
                            <TooltipTrigger asChild>
                              <div className="meal-card-health-score-label">
                                <span>{nutrient.name}</span>
                                <HelpCircle className="help-icon" />
                              </div>
                            </TooltipTrigger>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-sm text-zinc-400">{Math.round(nutrient.percentage)}%</span>
                    </div>
                    <div className="meal-card-health-score-bar">
                      <div 
                        className={`meal-card-health-score-progress ${getHealthScoreClass(nutrient.percentage, 'highGood')}`}
                        style={{ width: `${nutrient.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-zinc-700">
            <button
              onClick={() => onDelete(meal.id)}
              className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Meal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 