import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, Trash2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { API_BASE_URL } from '../../config';
import "./MealCard.css";

// Helper function to format a date safely
const formatDateSafely = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Unknown time";
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Unknown time";
  }
};

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
  meal_name: string;
  timestamp: string;
  image_url: string;
  health_tags: string[];
  macronutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  scores: {
    glycemic_index: number;
    inflammatory: number;
    heart_health: number;
    digestive: number;
    meal_balance: number;
  };
  micronutrient_balance?: {
    priority_nutrients: Array<{
      name: string;
      percentage: number;
      description?: string;
    }>;
  };
}

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
  priorityMicronutrients?: string[];
}

const healthScoreInfo = {
  glycemic_index: {
    label: "Glycemic Index",
    description: "Measures how quickly foods raise blood sugar levels. Lower scores are better for stable energy."
  },
  inflammatory: {
    label: "Inflammatory Score",
    description: "Indicates how likely foods are to cause inflammation. Lower scores mean less inflammatory."
  },
  heart_health: {
    label: "Heart Health Score",
    description: "Evaluates food impact on cardiovascular health. Higher scores are better for heart health."
  },
  digestive: {
    label: "Digestive Score",
    description: "Rates how easy foods are to digest and their effect on gut health. Higher scores indicate better digestive support."
  },
  meal_balance: {
    label: "Meal Balance Score",
    description: "Measures overall nutritional balance across all food groups. Higher scores indicate better balanced meals."
  }
};

export function MealCard({ meal, onDelete, expanded = false, onToggle, priorityMicronutrients }: MealCardProps) {
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

  const totalMacroGrams = 
    (meal.macronutrients.protein || 0) + 
    (meal.macronutrients.carbs || 0) + 
    (meal.macronutrients.fats || 0);

  const proteinPercentage = Math.round(totalMacroGrams > 0 
    ? (meal.macronutrients.protein / totalMacroGrams) * 100 
    : 33.33);
  
  const carbsPercentage = Math.round(totalMacroGrams > 0 
    ? (meal.macronutrients.carbs / totalMacroGrams) * 100 
    : 33.33);
  
  const fatsPercentage = Math.round(totalMacroGrams > 0 
    ? (meal.macronutrients.fats / totalMacroGrams) * 100 
    : 33.33);

  const formatScoreLabel = (key: string): string => {
    return key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() + key.slice(1);
  };

  // Function to get image URL
  const getImageUrl = (url: string): string => {
    console.log('=== Image URL Debug ===');
    console.log('Original image URL:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    if (!url) {
      console.log('No URL provided, using default image');
      return "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80";
    }
    
    try {
      // If it's a data URL, return it as is
      if (url.startsWith("data:image")) {
        console.log('Using data URL');
        return url;
      }

      // Extract the image ID from the URL
      let imageId: string | null = null;
      
      // Handle both old and new URL formats
      if (url.includes('/images/')) {
        const parts = url.split('/images/');
        imageId = parts[1];
        console.log('Extracted image ID:', imageId);
      } else if (url.includes('/api/nutrition/images/')) {
        const parts = url.split('/api/nutrition/images/');
        imageId = parts[1];
        console.log('Extracted image ID from API URL:', imageId);
      }
      
      if (!imageId) {
        console.error('Failed to extract image ID from URL');
        return "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80";
      }

      // Return the default image initially - we'll load the actual image in useEffect
      return "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80";
      
    } catch (error) {
      console.error('Error processing image URL:', error);
      return "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80";
    }
  };

  // State to track if we've already tried loading the image
  const [hasAttemptedLoad, setHasAttemptedLoad] = React.useState(false);
  const [imageBlobUrl, setImageBlobUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load and compress the image when the component mounts
  React.useEffect(() => {
    const loadImage = async () => {
      if (!meal.image_url) return;

      try {
        setIsLoading(true);
        // Extract the image ID from the URL
        let imageId: string | null = null;
        if (meal.image_url.includes('/images/')) {
          const parts = meal.image_url.split('/images/');
          imageId = parts[1];
        } else if (meal.image_url.includes('/api/nutrition/images/')) {
          const parts = meal.image_url.split('/api/nutrition/images/');
          imageId = parts[1];
        }

        if (!imageId) {
          console.error('Failed to extract image ID from URL');
          setHasAttemptedLoad(true);
          setIsLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setHasAttemptedLoad(true);
          setIsLoading(false);
          return;
        }

        // Always use the correct API path for fetching images
        const imageUrl = `${API_BASE_URL}/api/nutrition/images/${imageId}`;
        console.log('Fetching image from:', imageUrl);

        // Fetch the image with authentication
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }

        // Create a blob from the response
        const blob = await response.blob();
        
        // Compress the image if it's larger than 600KB
        let compressedBlob = blob;
        if (blob.size > 600 * 1024) { // 600KB in bytes
          const img = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Create a promise to handle image loading
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          });

          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 800; // Max width or height
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          compressedBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob!);
            }, 'image/jpeg', 0.8); // 80% quality
          });

          // Clean up
          URL.revokeObjectURL(img.src);
        }

        const blobUrl = URL.createObjectURL(compressedBlob);
        setImageBlobUrl(blobUrl);
        console.log('Successfully loaded and compressed image:', {
          originalSize: blob.size,
          compressedSize: compressedBlob.size,
          originalUrl: meal.image_url,
          blobUrl
        });
      } catch (error) {
        console.error('Error loading image:', error);
        setHasAttemptedLoad(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    // Cleanup function to revoke the blob URL when component unmounts
    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
    };
  }, [meal.image_url]);

  return (
    <div className="meal-card">
      <div className="meal-card-header">
        <div className="meal-card-content">
          <div className="meal-card-image">
            <div className="relative w-full h-full">
              <img 
                src={imageBlobUrl || getImageUrl(meal.image_url)}
                alt={meal.meal_name}
                className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onError={(e) => {
                  if (!hasAttemptedLoad) {
                    console.error("Failed to load image:", {
                      originalUrl: meal.image_url,
                      attemptedUrl: (e.target as HTMLImageElement).src,
                      error: e
                    });
                    setHasAttemptedLoad(true);
                  }
                }}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-lg">
                  <div className="w-8 h-8 border-4 border-zinc-600 border-t-zinc-200 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
          <div className="meal-card-info">
            <div className="meal-card-header-row">
              <div className="meal-card-title-container">
                <div className="flex items-center justify-between w-full">
                  <h3 className="meal-card-title">{meal.meal_name}</h3>
                  <span className="meal-card-time">{formatDateSafely(meal.timestamp)}</span>
                </div>
                <div className="meal-card-tags">
                  {meal.health_tags.map((tag, idx) => (
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
                <span>{meal.macronutrients.calories}kcal</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Protein:</span>
                <span>{meal.macronutrients.protein}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Carbs:</span>
                <span>{meal.macronutrients.carbs}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Fats:</span>
                <span>{meal.macronutrients.fats}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Fiber:</span>
                <span>{meal.macronutrients.fiber}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Sugar:</span>
                <span>{meal.macronutrients.sugar}g</span>
              </div>
              <div className="meal-card-nutrition-item">
                <span>Sodium:</span>
                <span>{meal.macronutrients.sodium}mg</span>
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
              {Object.entries(meal.scores).map(([key, value]) => {
                const scoreInfo = healthScoreInfo[key as keyof typeof healthScoreInfo];
                if (!scoreInfo) return null; // Skip if no info exists for this score
                
                return (
                  <div key={key} className="meal-card-health-score">
                    <div className="meal-card-health-score-header">
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip content={
                            <div className="meal-card-health-score-tooltip">
                              {scoreInfo.description}
                            </div>
                          }>
                            <TooltipTrigger asChild>
                              <div className="meal-card-health-score-label">
                                <span>{scoreInfo.label}</span>
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
                        className={`meal-card-health-score-progress ${getHealthScoreClass(value, key === 'glycemic_index' || key === 'inflammatory' ? 'lowGood' : 'highGood')}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {meal.micronutrient_balance && meal.micronutrient_balance.priority_nutrients.length > 0 && (
            <div className="meal-card-section">
              <div className="flex items-center justify-between mb-4">
                <h4 className="meal-card-section-title">Micronutrient Balance</h4>
                <TooltipProvider>
                  <Tooltip content={
                    <div className="meal-card-health-score-tooltip">
                      Shows the percentage of daily recommended intake for your priority micronutrients present in this meal.
                    </div>
                  }>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-zinc-400 cursor-help" />
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="meal-card-health-scores">
                {meal.micronutrient_balance.priority_nutrients.map((nutrient, index) => (
                  <div key={index} className="meal-card-health-score">
                    <div className="meal-card-health-score-header">
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip content={
                            <div className="meal-card-health-score-tooltip">
                              {nutrient.description || `Percentage of daily recommended intake for ${nutrient.name}.`}
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