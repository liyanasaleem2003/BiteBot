import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { CalendarIcon, ChevronLeft, ChevronRight, Edit, Flame, HelpCircle, Home, Info, Pill, Plus, Settings, Utensils, BookOpen, BarChart2, Trash2, Heart, X } from "lucide-react";
import { RecipeCard } from "../components/ui/RecipeCard";
import { MealCard } from "../components/MealCard/MealCard.tsx";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/ui/Footer";
import { useFavoriteRecipes } from "../context/FavoriteRecipesContext";
import "./Dashboard.css";
import { API_BASE_URL } from '../config';
import { micronutrientOptions } from "../data/profileOptions";

// Placeholder data
const macroData = [
  { current: 2100, goal: 2800, label: "Calories", unit: "kcal" },
  { current: 110, goal: 140, label: "Protein", unit: "g" },
  { current: 230, goal: 300, label: "Carbs", unit: "g" },
  { current: 60, goal: 80, label: "Fats", unit: "g" },
  { current: 20, goal: 30, label: "Fiber", unit: "g" },
  { current: 45, goal: 50, label: "Sugar", unit: "g" },
  { current: 1800, goal: 2300, label: "Sodium", unit: "mg" }
];

const healthScores = [
  { score: 75, label: "Glycemic Index", info: "Measures how quickly foods raise blood sugar levels. Lower scores are better for stable energy.", colorScale: "lowGood" },
  { score: 30, label: "Inflammatory Score", info: "Indicates how likely foods are to cause inflammation. Lower scores mean less inflammatory.", colorScale: "lowGood" },
  { score: 85, label: "Heart Health Score", info: "Evaluates food impact on cardiovascular health. Higher scores are better for heart health.", colorScale: "highGood" },
  { score: 70, label: "Digestive Score", info: "Rates how easy foods are to digest and their effect on gut health. Higher scores indicate better digestive support.", colorScale: "highGood" },
  { score: 80, label: "Meal Balance Score", info: "Measures overall nutritional balance across all food groups. Higher scores indicate better balanced meals.", colorScale: "highGood" },
];

const supplements = [
  { name: "Vitamin D3", dose: "2000 IU" },
  { name: "Omega 3 Fish Oil", dose: "1000mg" },
  { name: "Magnesium Citrate", dose: "200mg" },
  { name: "Vitamin B Complex", dose: "1 tablet" },
];

const meals = [
  {
    id: "meal1",
    name: "Masala Oats with Vegetables Breakfast",
    time: "8:30 AM",
    image: "https://kiipfit.com/wp-content/uploads/2015/04/masala-oatmeal-5-2.0-1024x1024.jpg",
    tags: ["High-Fiber", "Low-Sodium", "Plant-Based", "Iron-Rich"],
    macros: {
      calories: 380,
      protein: 15,
      carbs: 55,
      fats: 10,
      fiber: 8,
      sugar: 5,
      sodium: 220
    },
    healthScores: {
      glycemic: 55,
      inflammatory: 20,
      heart: 95,
      digestive: 90,
      balance: 90
    },
    micronutrient_balance: {
      score: 85,
      priority_nutrients: [
        { name: "Iron", percentage: 75 },
        { name: "Fiber", percentage: 90 },
        { name: "B12", percentage: 60 }
      ]
    }
  },
  {
    id: "meal2",
    name: "Tandoori Paneer Wrap Lunch",
    time: "1:15 PM",
    image: "https://ministryofcurry.com/wp-content/uploads/2019/10/paneer-kathi-rolls-1-1-850x1133.jpg",
    tags: ["High-Protein", "Balanced-Meal", "Vegetarian", "Calcium-Rich"],
    macros: {
      calories: 620,
      protein: 32,
      carbs: 70,
      fats: 25,
      fiber: 6,
      sugar: 6,
      sodium: 580
    },
    healthScores: {
      glycemic: 65,
      inflammatory: 30,
      heart: 85,
      digestive: 80,
      balance: 85
    },
    micronutrient_balance: {
      score: 80,
      priority_nutrients: [
        { name: "Calcium", percentage: 85 },
        { name: "Protein", percentage: 90 },
        { name: "Vitamin D", percentage: 65 }
      ]
    }
  },
  {
    id: "meal3",
    name: "Apple & Peanut Butter Snack",
    time: "4:00 PM",
    image: "https://i0.wp.com/images-prod.healthline.com/hlcmsresource/images/AN_images/apple-and-peanut-butter-1296x728-feature.jpg?w=1155&h=1528",
    tags: ["Quick-Energy", "Heart-Healthy", "Low-Sodium", "Protein-Rich"],
    macros: {
      calories: 280,
      protein: 8,
      carbs: 35,
      fats: 15,
      fiber: 6,
      sugar: 20,
      sodium: 45
    },
    healthScores: {
      glycemic: 45,
      inflammatory: 15,
      heart: 90,
      digestive: 85,
      balance: 80
    },
    micronutrient_balance: {
      score: 75,
      priority_nutrients: [
        { name: "Fiber", percentage: 80 },
        { name: "Protein", percentage: 70 },
        { name: "Healthy Fats", percentage: 85 }
      ]
    }
  },
  {
    id: "meal4",
    name: "Lentil Vegetable Curry & Rice Dinner",
    time: "7:30 PM",
    image: "https://cookingforpeanuts.com/wp-content/uploads/2021/09/15-Minute-Lentil-Veggie-Curry-1.jpg",
    tags: ["Protein-Rich", "Plant-Based", "Iron-Rich", "High-Fiber"],
    macros: {
      calories: 580,
      protein: 28,
      carbs: 90,
      fats: 12,
      fiber: 12,
      sugar: 4,
      sodium: 520
    },
    healthScores: {
      glycemic: 55,
      inflammatory: 25,
      heart: 95,
      digestive: 90,
      balance: 95
    },
    micronutrient_balance: {
      score: 90,
      priority_nutrients: [
        { name: "Iron", percentage: 85 },
        { name: "Fiber", percentage: 95 },
        { name: "Folate", percentage: 80 }
      ]
    }
  }
];

// Add default empty values for health scores
const defaultHealthScores = [
  { score: 0, label: "Glycemic Index", info: "Measures how quickly foods raise blood sugar levels. Lower scores are better for stable energy.", colorScale: "lowGood" },
  { score: 0, label: "Inflammatory Score", info: "Indicates how likely foods are to cause inflammation. Lower scores mean less inflammatory.", colorScale: "lowGood" },
  { score: 0, label: "Heart Health Score", info: "Evaluates food impact on cardiovascular health. Higher scores are better for heart health.", colorScale: "highGood" },
  { score: 0, label: "Digestive Score", info: "Rates how easy foods are to digest and their effect on gut health. Higher scores indicate better digestive support.", colorScale: "highGood" },
  { score: 0, label: "Meal Balance Score", info: "Measures overall nutritional balance across all food groups. Higher scores indicate better balanced meals.", colorScale: "highGood" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState("");
  const [newSupplementDose, setNewSupplementDose] = useState("");
  const [userSupplements, setUserSupplements] = useState([]);
  const [supplementIds, setSupplementIds] = useState(new Map());
  const [userMeals, setUserMeals] = useState([]);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [lastFetchedDate, setLastFetchedDate] = useState(null);
  const [error, setError] = useState(null);
  const { favoriteRecipes, removeFavoriteRecipe } = useFavoriteRecipes();
  
  // Add state for user profile and nutritional needs
  const [userProfile, setUserProfile] = useState(null);
  const [nutritionalNeeds, setNutritionalNeeds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRealDataForAllDays, setShowRealDataForAllDays] = useState(true);

  // Add state for priority micronutrients
  const [priorityMicronutrients, setPriorityMicronutrients] = useState([]);

  // Fetch user profile and nutritional needs
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setError('Authentication error. Please log in again.');
          setLoading(false);
          return;
        }

        // Remove Bearer prefix if it exists
        const cleanToken = token.replace('Bearer ', '');

        console.log('Fetching user profile with token:', cleanToken);
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('Authentication error. Token may be invalid or expired.');
            localStorage.removeItem('token');
            navigate('/signup');
            setError('Authentication error. Please log in again.');
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Profile data received:', data);
        setUserProfile(data);
        if (data.profile?.nutritional_needs) {
          console.log("Nutritional needs:", data.profile.nutritional_needs); // Debug log
          setNutritionalNeeds(data.profile.nutritional_needs);
        } else {
          console.log("No nutritional needs found in profile data"); // Debug log
        }
        // Set priority micronutrients from profile
        if (data.profile?.priority_micronutrients) {
          setPriorityMicronutrients(data.profile.priority_micronutrients);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(`Failed to load profile: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Fetch meals when dashboard loads or date changes
  useEffect(() => {
    const loadMeals = async () => {
      try {
        // Use the fetchMeals function which handles placeholder meals for non-today dates
        await fetchMeals(currentDate);
      } catch (error) {
        console.error('Error loading meals:', error);
        setError(`Failed to load meals: ${error.message}`);
      }
    };

    loadMeals();
  }, [currentDate]);

  // Fetch meals for the selected date
  const fetchMeals = async (date) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication error. Please log in again.');
        return;
      }

      // Remove Bearer prefix if it exists
      const cleanToken = token.replace('Bearer ', '');

      const formattedDate = date.toISOString().split('T')[0];
      console.log('Fetching meals for date:', formattedDate);
      
      // Check if the date is today
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      if (isToday) {
        // For today, fetch actual meals from the backend
        console.log(`Fetching meals for today: ${formattedDate}`);
        const response = await fetch(`${API_BASE_URL}/api/nutrition/meals/${formattedDate}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch meals: ${response.status} ${response.statusText}`);
          const errorData = await response.json().catch(() => ({}));
          console.error('Error details:', errorData);
          throw new Error(`Failed to fetch meals: ${errorData.detail || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched meals:', data);
        
        // Transform the meals data to match the MealCard interface
        const transformedMeals = (data.meals || []).map(meal => {
          console.log('Processing meal:', meal);
          
          // Ensure we have valid timestamp data
          let timestamp;
          try {
            // Try parsing the timestamp
            timestamp = new Date(meal.timestamp || meal.date).toISOString();
            console.log('Parsed timestamp:', timestamp);
          } catch (error) {
            console.error('Failed to parse timestamp:', error);
            // Use current date as fallback
            timestamp = new Date().toISOString();
          }
          
          return {
            id: meal.id,
            meal_name: meal.meal_name || "Unnamed Meal",
            timestamp: timestamp,
            image_url: meal.image_url || "",
            health_tags: meal.health_tags || [],
            macronutrients: {
              calories: meal.macronutrients?.calories || 0,
              protein: meal.macronutrients?.protein || 0,
              carbs: meal.macronutrients?.carbs || 0,
              fats: meal.macronutrients?.fats || 0,
              fiber: meal.macronutrients?.fiber || 0,
              sugar: meal.macronutrients?.sugar || 0,
              sodium: meal.macronutrients?.sodium || 0
            },
            scores: {
              glycemic_index: meal.scores?.glycemic_index || 0,
              inflammatory: meal.scores?.inflammatory || 0,
              heart_health: meal.scores?.heart_health || 0,
              digestive: meal.scores?.digestive || 0,
              meal_balance: meal.scores?.meal_balance || 0
            },
            micronutrient_balance: meal.micronutrient_balance || {
              score: 0,
              priority_nutrients: []
            }
          };
        });
        
        console.log('Transformed meals:', transformedMeals);
        setUserMeals(transformedMeals);
      } else {
        // For non-today dates, show placeholder meals
        console.log('Using placeholder meals for non-today date');
        const placeholderMeals = meals.map(meal => ({
          id: `${meal.id}-${formattedDate}`,
          meal_name: meal.name,
          timestamp: `${formattedDate}T${meal.time}`,
          image_url: meal.image,
          health_tags: meal.tags || [],
          macronutrients: {
            calories: meal.macros.calories || 0,
            protein: meal.macros.protein || 0,
            carbs: meal.macros.carbs || 0,
            fats: meal.macros.fats || 0,
            fiber: meal.macros.fiber || 0,
            sugar: meal.macros.sugar || 0,
            sodium: meal.macros.sodium || 0
          },
          scores: {
            glycemic_index: meal.healthScores.glycemic || 0,
            inflammatory: meal.healthScores.inflammatory || 0,
            heart_health: meal.healthScores.heart || 0,
            digestive: meal.healthScores.digestive || 0,
            meal_balance: meal.healthScores.balance || 0
          },
          micronutrient_balance: meal.micronutrient_balance || {
            score: 0,
            priority_nutrients: []
          }
        }));
        
        setUserMeals(placeholderMeals);
      }
      
      setLastFetchedDate(formattedDate);
    } catch (error) {
      console.error('Error fetching meals:', error);
      setError(`Failed to fetch meals: ${error.message}`);
      setUserMeals([]);
    }
  };

  // Update the calculateTotalNutrition function to handle empty state
  const calculateTotalNutrition = () => {
    console.log("Calculating totals from meals:", userMeals);
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    if (!Array.isArray(userMeals) || userMeals.length === 0) {
      console.log("No meals logged, returning empty totals");
      return totals;
    }

    userMeals.forEach(meal => {
      if (meal && meal.macronutrients) {  // Changed from meal.macros to meal.macronutrients
        Object.keys(totals).forEach(key => {
          const value = Number(meal.macronutrients[key]) || 0;  // Changed from meal.macros to meal.macronutrients
          totals[key] += value;
        });
      }
    });

    // Round all values to 1 decimal place for consistency
    Object.keys(totals).forEach(key => {
      totals[key] = Math.round(totals[key] * 10) / 10;
    });

    console.log("Calculated totals:", totals);
    return totals;
  };

  // Get current nutritional values and goals
  const currentNutrition = calculateTotalNutrition();
  const nutritionalGoals = nutritionalNeeds ? {
    calories: nutritionalNeeds.calories.max,
    protein: nutritionalNeeds.macros.protein.max,
    carbs: nutritionalNeeds.macros.carbs.max,
    fats: nutritionalNeeds.macros.fats.max,
    fiber: nutritionalNeeds.other_nutrients.fiber.max,
    sugar: nutritionalNeeds.other_nutrients.sugar.max,
    sodium: nutritionalNeeds.other_nutrients.sodium.max
  } : null;

  // Add this function to get the unit for a nutrient
  const getNutrientUnit = (nutrientType) => {
    if (!nutritionalNeeds) return '';
    
    if (nutrientType === 'calories') return 'kcal';
    if (nutrientType in nutritionalNeeds.macros) {
      return nutritionalNeeds.macros[nutrientType].unit;
    }
    if (nutrientType in nutritionalNeeds.other_nutrients) {
      return nutritionalNeeds.other_nutrients[nutrientType].unit;
    }
    return '';
  };

  // Add this function to get the goal for a nutrient
  const getNutrientGoal = (nutrientType) => {
    if (!nutritionalNeeds) return 0;
    
    if (nutrientType === 'calories') {
      return nutritionalNeeds.calories.max;
    }
    if (nutrientType in nutritionalNeeds.macros) {
      return nutritionalNeeds.macros[nutrientType].max;
    }
    if (nutrientType in nutritionalNeeds.other_nutrients) {
      return nutritionalNeeds.other_nutrients[nutrientType].max;
    }
    return 0;
  };

  // Update the ProgressCircle component to handle exceeded values
  const ProgressCircle = ({ current, nutrientType, label }) => {
    const goal = getNutrientGoal(nutrientType);
    const unit = getNutrientUnit(nutrientType);
    
    // Ensure we have valid numbers
    const currentValue = Number(current) || 0;
    const goalValue = Number(goal) || 1; // Prevent division by zero
    
    const percentage = Math.min(Math.round((currentValue / goalValue) * 100), 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isExceeded = currentValue > goalValue;
    
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-[100px] h-[100px]">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={isExceeded ? "rgb(239, 68, 68)" : "#9d5e26"}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-2xl font-bold ${isExceeded ? "text-red-500" : ""}`}>{currentValue}</span>
            <span className="text-xs text-zinc-400">{unit}</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-zinc-400">{goalValue} {unit}</div>
        </div>
      </div>
    );
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDateString = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handleAddSupplement = async () => {
    if (newSupplementName && newSupplementDose) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/supplements/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            name: newSupplementName,
            dose: newSupplementDose
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to add supplement');
        }

        const data = await response.json();
        // Use user_id as a fallback if _id is null
        const newSupplement = {
          ...data,
          id: data._id || data.user_id
        };
        setUserSupplements(prev => [...prev, newSupplement]);
        setNewSupplementName("");
        setNewSupplementDose("");
        setShowAddSupplement(false);
      } catch (error) {
        console.error('Error adding supplement:', error);
        setError(`Failed to add supplement: ${error.message}`);
      }
    }
  };

  const handleDeleteSupplement = async (supplementId) => {
    try {
      console.log('Delete clicked for supplement:', supplementId);
      console.log('Current supplements:', userSupplements);

      if (!supplementId) {
        console.error('No supplement ID provided');
        throw new Error('Supplement ID is required');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Find the supplement in the current supplements array
      const supplementToDelete = userSupplements.find(s => s.id === supplementId);

      if (!supplementToDelete) {
        console.error('Supplement not found with ID:', supplementId);
        console.error('Available supplements:', userSupplements.map(s => ({ id: s.id, name: s.name })));
        throw new Error('Supplement not found in local state');
      }

      // Use _id for deletion if available, otherwise use the baseKey
      const deleteId = supplementToDelete._id || supplementToDelete.baseKey;

      console.log('Making delete request to:', `${API_BASE_URL}/api/supplements/${deleteId}`);
      const response = await fetch(`${API_BASE_URL}/api/supplements/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete response error:', errorData);
        throw new Error(errorData.detail || 'Failed to delete supplement');
      }

      console.log('Successfully deleted supplement');
      setUserSupplements(prevSupplements => 
        prevSupplements.filter(s => s.id !== supplementId)
      );
    } catch (error) {
      console.error('Error deleting supplement:', error);
      setError(`Failed to delete supplement: ${error.message}`);
    }
  };

  // Update the fetchSupplements function
  useEffect(() => {
    const fetchSupplements = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const formattedDate = currentDate.toISOString().split('T')[0];
        const response = await fetch(`${API_BASE_URL}/api/supplements?date=${formattedDate}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch supplements');
        }

        const data = await response.json();
        
        // Generate unique IDs for supplements
        const supplementCounts = new Map();
        const supplementsWithIds = data.map(supplement => {
          const baseKey = `${supplement.user_id}-${supplement.name}-${supplement.dose}`;
          const count = (supplementCounts.get(baseKey) || 0) + 1;
          supplementCounts.set(baseKey, count);
          const supplementId = `${baseKey}-${count}`;
          
          return {
            ...supplement,
            id: supplementId,
            baseKey: baseKey
          };
        });
        
        console.log('Fetched supplements with IDs:', supplementsWithIds);
        setUserSupplements(supplementsWithIds);
      } catch (error) {
        console.error('Error fetching supplements:', error);
        setError(`Failed to load supplements: ${error.message}`);
      }
    };

    fetchSupplements();
  }, [currentDate]);

  const displaySupplements = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return userSupplements;
    } else {
      // For non-today dates, don't allow deletion of placeholder supplements
      return supplements.map((supplement, index) => ({
        ...supplement,
        id: null // Set id to null for placeholders
      }));
    }
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      console.log(`Deleting meal with ID: ${mealId}`);
      
      // Only make API call for real meals (not placeholders)
      if (mealId && !mealId.includes('-')) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`${API_BASE_URL}/nutrition/meals/${mealId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error deleting meal:', errorData);
          throw new Error(errorData.detail || 'Failed to delete meal');
        }
        
        console.log('Meal deleted successfully from backend');
      } else {
        console.log('Deleting placeholder meal (no API call needed)');
      }
      
      // Remove the meal from the local state
      setUserMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
      setError(`Failed to delete meal: ${error.message}`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Update the getDayLoggedStreak function to check for meals today
  const getDayLoggedStreak = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    if (isToday) {
      // If there are meals logged today, return 1, otherwise 0
      return userMeals.length > 0 ? 1 : 0;
    }
    return 15; // Return 15 for other days
  };

  const handleToggleMeal = (mealId) => {
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  const handleToggleFavorite = (recipe) => {
    // Since we're on the dashboard, we should only allow removing recipes
    console.log(`Removing recipe ${recipe.recipe_id} from favorites`);
    removeFavoriteRecipe(recipe.recipe_id);
  };

  // Update the HealthScoreBar component to handle empty state
  const HealthScoreBar = ({ score, label, info, colorScale }) => {
    let barColor = "";
    
    if (colorScale === "lowGood") {
      // Low is good (0-33: green, 34-66: yellow, 67-100: red)
      if (score <= 33) barColor = "bg-emerald-500";
      else if (score <= 66) barColor = "bg-amber-500";
      else barColor = "bg-red-500";
    } else {
      // High is good (0-33: red, 34-66: yellow, 67-100: green)
      if (score <= 33) barColor = "bg-red-500";
      else if (score <= 66) barColor = "bg-amber-500";
      else barColor = "bg-emerald-500";
    }
    
    return (
      <div className="group w-full">
        <div className="flex items-center justify-between mb-1">
          <div className="health-score-label">
            <span className="text-sm">{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center">
                    <HelpCircle className="help-icon" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="meal-card-health-score-tooltip">
                    {info}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-sm">{score}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${barColor}`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Update the CaloriesBar component to handle exceeded values
  const CaloriesBar = ({ current, goal }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    const isExceeded = current > goal;
    
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold">Calories</h3>
            <p className={`text-sm ${isExceeded ? "text-red-500" : "text-zinc-400"}`}>{current} / {goal} kcal</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold ${isExceeded ? "text-red-500" : ""}`}>{Math.round(percentage)}%</p>
          </div>
        </div>
        <div className="h-4 bg-black/30 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${isExceeded ? "bg-red-500" : "bg-[#9d5e26]"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Add this function to get the label for a micronutrient ID
  const getMicronutrientLabel = (id) => {
    const nutrient = micronutrientOptions.find(n => n.id === id);
    return nutrient ? nutrient.label : id;
  };

  // Add this function to process health tags
  const processHealthTags = (tags) => {
    if (!tags || !Array.isArray(tags)) return [];
    
    // Capitalize first letter of each tag and ensure proper formatting
    const processedTags = tags.map(tag => {
      // If tag is already capitalized, return as is
      if (tag && tag.charAt(0) === tag.charAt(0).toUpperCase()) {
        return tag;
      }
      
      // Split by spaces and capitalize each word
      return tag.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });
    
    // Limit to 3-5 tags
    if (processedTags.length > 5) {
      return processedTags.slice(0, 5);
    } else if (processedTags.length < 3) {
      // If we have fewer than 3 tags, add some generic health tags based on macros
      const genericTags = [];
      
      // Only add these if we need more tags to reach 3
      if (processedTags.length < 3) {
        // Check if we can infer some health benefits from the macronutrients
        const macroTags = [];
        
        // These will only be used if we have fewer than 3 tags
        if (macroTags.length > 0) {
          // Add only as many as needed to reach 3 tags
          const neededTags = 3 - processedTags.length;
          genericTags.push(...macroTags.slice(0, neededTags));
        }
      }
      
      return [...processedTags, ...genericTags];
    }
    
    return processedTags;
  };

  // Update the getHealthScores function to calculate scores from meals
  const getHealthScores = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    if (isToday && userMeals.length > 0) {
      // Calculate average scores from today's meals
      const scores = userMeals.reduce((acc, meal) => {
        if (meal.healthScores) {
          acc.glycemic += meal.healthScores.glycemic || 0;
          acc.inflammatory += meal.healthScores.inflammatory || 0;
          acc.heart += meal.healthScores.heart || 0;
          acc.digestive += meal.healthScores.digestive || 0;
          acc.balance += meal.healthScores.balance || 0;
        }
        return acc;
      }, { glycemic: 0, inflammatory: 0, heart: 0, digestive: 0, balance: 0 });

      // Calculate averages
      const mealCount = userMeals.length;
      return [
        { 
          score: Math.round(scores.glycemic / mealCount), 
          label: "Glycemic Index", 
          info: "Measures how quickly foods raise blood sugar levels. Lower scores are better for stable energy.", 
          colorScale: "lowGood" 
        },
        { 
          score: Math.round(scores.inflammatory / mealCount), 
          label: "Inflammatory Score", 
          info: "Indicates how likely foods are to cause inflammation. Lower scores mean less inflammatory.", 
          colorScale: "lowGood" 
        },
        { 
          score: Math.round(scores.heart / mealCount), 
          label: "Heart Health Score", 
          info: "Evaluates food impact on cardiovascular health. Higher scores are better for heart health.", 
          colorScale: "highGood" 
        },
        { 
          score: Math.round(scores.digestive / mealCount), 
          label: "Digestive Score", 
          info: "Rates how easy foods are to digest and their effect on gut health. Higher scores indicate better digestive support.", 
          colorScale: "highGood" 
        },
        { 
          score: Math.round(scores.balance / mealCount), 
          label: "Meal Balance Score", 
          info: "Measures overall nutritional balance across all food groups. Higher scores indicate better balanced meals.", 
          colorScale: "highGood" 
        }
      ];
    }
    
    return defaultHealthScores;
  };

  // Add loading state display
  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="dashboard-content">
          <div className="flex items-center justify-center h-full">
            <div className="text-white">Loading your profile...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="text-2xl font-bold text-white">Nutrition Dashboard</h1>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDay('prev')}
              className="h-8 w-8 bg-black/50 border-zinc-700 text-white hover:bg-black/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                className="date-button"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateString(currentDate)}
                {isToday(currentDate) && " (Today)"}
              </Button>
              
              {showCalendar && (
                <div className="calendar-container">
                  <div className="calendar">
                    <div className="calendar-header">
                      <button onClick={() => navigateDay('prev')} className="calendar-nav-button">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="calendar-month">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={() => navigateDay('next')} className="calendar-nav-button">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="calendar-grid">
                      <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="calendar-weekday">{day}</div>
                        ))}
                      </div>
                      <div className="calendar-days">
                        {Array.from({ length: 42 }, (_, i) => {
                          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                          date.setDate(date.getDate() - date.getDay() + i);
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                          const isToday = date.toDateString() === new Date().toDateString();
                          const isSelected = date.toDateString() === currentDate.toDateString();
                          
                          return (
                            <button
                              key={i}
                              className={`calendar-day ${!isCurrentMonth ? 'calendar-day-other-month' : ''} 
                                        ${isToday ? 'calendar-day-today' : ''} 
                                        ${isSelected ? 'calendar-day-selected' : ''}`}
                              onClick={() => {
                                setCurrentDate(date);
                                setLastFetchedDate(null); // Force a refresh of meals
                                setShowCalendar(false); // Hide calendar after selection
                              }}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDay('next')}
              className="h-8 w-8 bg-black/50 border-zinc-700 text-white hover:bg-black/70"
              disabled={isToday(currentDate)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center text-red-200">
              <Info className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Left Section - Dashboard UI */}
          <div className="dashboard-sidebar">
            {/* Streak Tracker */}
            <Card className="dashboard-card bg-black/50 border-zinc-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Your Progress</h2>
                <div className="dashboard-streak">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{getDayLoggedStreak()} Days Logged</span>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-2">Track your daily nutrition and health scores to monitor your progress.</p>
            </Card>

            {/* Macronutrient Progress */}
            <Card className="dashboard-card bg-black/50 border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 text-white">Daily Macronutrients</h2>
              
              {/* Calories Bar */}
              {nutritionalNeeds && (
                <CaloriesBar 
                  current={currentNutrition.calories} 
                  goal={nutritionalNeeds.calories.max} 
                />
              )}
              
              {/* First row of macros */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {nutritionalNeeds && (
                  <>
                    <ProgressCircle 
                      current={currentNutrition.protein} 
                      nutrientType="protein"
                      label="Protein" 
                    />
                    <ProgressCircle 
                      current={currentNutrition.carbs} 
                      nutrientType="carbs"
                      label="Carbs" 
                    />
                    <ProgressCircle 
                      current={currentNutrition.fats} 
                      nutrientType="fats"
                      label="Fats" 
                    />
                  </>
                )}
              </div>
              
              {/* Second row of macros */}
              <div className="grid grid-cols-3 gap-4">
                {nutritionalNeeds && (
                  <>
                    <ProgressCircle 
                      current={currentNutrition.fiber} 
                      nutrientType="fiber"
                      label="Fiber" 
                    />
                    <ProgressCircle 
                      current={currentNutrition.sugar} 
                      nutrientType="sugar"
                      label="Sugar" 
                    />
                    <ProgressCircle 
                      current={currentNutrition.sodium} 
                      nutrientType="sodium"
                      label="Sodium" 
                    />
                  </>
                )}
              </div>
            </Card>

            {/* Health Scores */}
            <Card className="dashboard-card bg-black/50 border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Health Scores</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="info-icon-button">
                        <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="left"
                      align="center"
                      className="bg-zinc-900 px-3 py-2 text-sm rounded-md border border-zinc-800 max-w-[250px]"
                    >
                      These scores are calculated based on your food intake and provide a holistic view of your nutritional health.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="dashboard-health-scores">
                {getHealthScores().map((score, index) => (
                  <HealthScoreBar key={index} {...score} />
                ))}
              </div>

              {/* Micronutrient Balance Section */}
              <div className="dashboard-micronutrient-balance">
                <div className="dashboard-micronutrient-balance-header">
                  <div className="dashboard-micronutrient-balance-title">
                    <span>Micronutrient Balance</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="help-icon" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="dashboard-micronutrient-tooltip">
                            Shows the average percentage of daily recommended intake for your priority micronutrients.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="dashboard-micronutrient-balance-score">
                    {userMeals.length > 0 ? 
                      `${Math.round(userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.score || 0), 0) / userMeals.length)}%` 
                      : '0%'}
                  </span>
                </div>
                <div className="dashboard-micronutrient-balance-bar">
                  <div 
                    className={`dashboard-micronutrient-balance-progress ${
                      userMeals.length > 0 ? 
                        (userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.score || 0), 0) / userMeals.length >= 70 ? 'good' :
                        userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.score || 0), 0) / userMeals.length >= 40 ? 'warning' : 'poor')
                        : 'poor'
                    }`}
                    style={{ 
                      width: `${userMeals.length > 0 ? 
                        userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.score || 0), 0) / userMeals.length : 0}%` 
                    }}
                  />
                </div>
                <div className="dashboard-micronutrient-balance-details">
                  {priorityMicronutrients.length > 0 ? (
                    priorityMicronutrients.map((nutrient, index) => (
                      <div key={index} className="dashboard-micronutrient-balance-item">
                        <div className="dashboard-micronutrient-balance-item-name">
                          <span>{getMicronutrientLabel(nutrient)}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="help-icon" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="dashboard-micronutrient-tooltip">
                                  {micronutrientOptions.find(n => n.id === nutrient)?.description || 
                                   `Percentage of daily recommended intake for ${getMicronutrientLabel(nutrient)}.`}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="dashboard-micronutrient-balance-item-value">
                          <span>{userMeals.length > 0 ? 
                            `${Math.round(userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.priority_nutrients?.find(n => n.name === nutrient)?.percentage || 0), 0) / userMeals.length)}%` 
                            : '0%'}</span>
                          <div className="dashboard-micronutrient-balance-item-bar">
                            <div 
                              className={`dashboard-micronutrient-balance-item-progress ${
                                userMeals.length > 0 && 
                                (userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.priority_nutrients?.find(n => n.name === nutrient)?.percentage || 0), 0) / userMeals.length >= 70 ? 'good' :
                                userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.priority_nutrients?.find(n => n.name === nutrient)?.percentage || 0), 0) / userMeals.length >= 40 ? 'warning' : 'poor')
                              }`}
                              style={{ 
                                width: `${userMeals.length > 0 ? 
                                  Math.min(userMeals.reduce((acc, meal) => acc + (meal.micronutrient_balance?.priority_nutrients?.find(n => n.name === nutrient)?.percentage || 0), 0) / userMeals.length, 100) : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-micronutrient-balance-empty">
                      <span>No priority micronutrients set in your profile</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-zinc-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-white">Micronutrient Focus</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-zinc-400 hover:text-white"
                    onClick={() => navigate('/myprofile')}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 text-sm">
                  {priorityMicronutrients.length > 0 ? (
                    priorityMicronutrients.map((nutrient) => (
                      <Badge 
                        key={nutrient} 
                        variant="outline" 
                        className="mr-1 bg-black/30 border-zinc-700 text-zinc-300"
                      >
                        {getMicronutrientLabel(nutrient)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-zinc-500">No priority micronutrients set</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Supplements Tracker */}
            <Card className="dashboard-card bg-black/50 border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 text-white">Daily Supplements</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAddSupplement(!showAddSupplement)}
                  className="flex items-center w-full bg-black/30 rounded-lg p-3 border border-zinc-700 cursor-pointer hover:bg-black/40"
                >
                  <Plus className="h-4 w-4 text-zinc-400" />
                  <span className="ml-3 text-zinc-300">Add Supplement</span>
                </button>

                <div className={`supplement-form-container ${showAddSupplement ? 'show' : ''}`}>
                  <div className={`supplement-form ${showAddSupplement ? 'show' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Add New Supplement</h3>
                      <button 
                        onClick={() => setShowAddSupplement(false)}
                        className="text-zinc-400 hover:text-zinc-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        value={newSupplementName}
                        onChange={(e) => setNewSupplementName(e.target.value)}
                        placeholder="Supplement name" 
                        className="w-full bg-black/30 border border-zinc-700 rounded-lg p-3 text-white placeholder:text-zinc-500"
                      />
                      <input 
                        type="text" 
                        value={newSupplementDose}
                        onChange={(e) => setNewSupplementDose(e.target.value)}
                        placeholder="Dose (e.g., 1000mg, 2 tablets)" 
                        className="w-full bg-black/30 border border-zinc-700 rounded-lg p-3 text-white placeholder:text-zinc-500"
                      />
                      <button 
                        onClick={handleAddSupplement} 
                        className="w-full bg-[#D4E157] hover:bg-[#DCE775] text-black font-medium rounded-lg p-3"
                      >
                        Add Supplement
                      </button>
                    </div>
                  </div>
                </div>
                
                {displaySupplements().map((supplement) => (
                  <div key={supplement.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center">
                      <Pill className="h-4 w-4 text-zinc-400" />
                      <span className="ml-3 text-zinc-300">{supplement.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-zinc-500 mr-2">{supplement.dose}</span>
                      {isToday(currentDate) && supplement.id && (
                        <button
                          onClick={() => handleDeleteSupplement(supplement.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Center & Right Sections - Meal Diary and Saved Recipes */}
          <div className="dashboard-main">
            {/* Meal Diary */}
            <Card className="dashboard-card bg-black/50 border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 text-white">Meal Diary</h2>
              <div className="meal-diary-container">
                {userMeals.length > 0 ? (
                  userMeals.map((meal) => (
                    <MealCard 
                      key={meal.id} 
                      meal={meal} 
                      onDelete={handleDeleteMeal}
                      expanded={expandedMealId === meal.id}
                      onToggle={() => handleToggleMeal(meal.id)}
                    />
                  ))
                ) : (
                  <div className="empty-recipes-state">
                    <Utensils className="heart-icon" size={48} />
                    <h3>No Meals Logged Yet</h3>
                    <p>Start tracking your meals by adding them to your diary. Use our AI to analyze and log your meals!</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Saved Recipes */}
            <Card className="dashboard-card bg-black/50 border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 text-white">Saved Recipes</h2>
              <div className="saved-recipes-container">
                {favoriteRecipes.length > 0 ? (
                  <div className="saved-recipes-grid">
                    {favoriteRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.recipe_id}
                        {...recipe}
                        isFavorite={true}
                        onFavoriteToggle={() => handleToggleFavorite(recipe)}
                        location="dashboard"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-recipes-state">
                    <Heart className="heart-icon" size={48} />
                    <h3>No Saved Recipes Yet</h3>
                    <p>Heart your favorite recipes from our wide variety of healthy South Asian dishes to see them here!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}