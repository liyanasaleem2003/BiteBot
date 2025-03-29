import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Edit, Flame, HelpCircle, Home, Info, Pill, Plus, Settings, Utensils, BookOpen, BarChart2, Trash2, Heart, X } from "lucide-react";
import { RecipeCard } from "../components/ui/RecipeCard";
import { MealCard } from "../components/MealCard/MealCard.tsx";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/ui/Footer";
import { useFavoriteRecipes } from "../context/FavoriteRecipesContext";
import "./Dashboard.css";

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
    name: "Masala Oats Breakfast",
    time: "8:30 AM",
    image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80",
    tags: ["High-Fiber", "Low-Sodium", "Plant-Based"],
    macros: {
      calories: 320,
      protein: 12,
      carbs: 45,
      fats: 8,
      fiber: 6,
      sugar: 4,
      sodium: 180
    },
    healthScores: {
      glycemic: 65,
      inflammatory: 25,
      heart: 90,
      digestive: 85,
      balance: 85
    }
  },
  {
    id: "meal2",
    name: "Tandoori Paneer Wrap",
    time: "1:15 PM",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&dpr=2&q=80",
    tags: ["High-Protein", "Balanced-Meal", "Vegetarian"],
    macros: {
      calories: 580,
      protein: 28,
      carbs: 65,
      fats: 22,
      fiber: 4,
      sugar: 8,
      sodium: 640
    },
    healthScores: {
      glycemic: 70,
      inflammatory: 35,
      heart: 80,
      digestive: 75,
      balance: 85
    }
  },
  {
    id: "meal3",
    name: "Apple & Nut Butter Snack",
    time: "4:00 PM",
    image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&dpr=2&q=80",
    tags: ["Quick-Energy", "Heart-Healthy", "Low-Sodium"],
    macros: {
      calories: 210,
      protein: 5,
      carbs: 25,
      fats: 12,
      fiber: 4,
      sugar: 18,
      sodium: 40
    },
    healthScores: {
      glycemic: 50,
      inflammatory: 20,
      heart: 85,
      digestive: 80,
      balance: 75
    }
  },
  {
    id: "meal4",
    name: "Lentil Vegetable Curry & Rice",
    time: "7:30 PM",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&dpr=2&q=80",
    tags: ["Protein-Rich", "Plant-Based", "Iron-Rich"],
    macros: {
      calories: 620,
      protein: 24,
      carbs: 85,
      fats: 15,
      fiber: 10,
      sugar: 6,
      sodium: 580
    },
    healthScores: {
      glycemic: 60,
      inflammatory: 30,
      heart: 90,
      digestive: 85,
      balance: 90
    }
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState("");
  const [newSupplementDose, setNewSupplementDose] = useState("");
  const [userSupplements, setUserSupplements] = useState(supplements);
  const [userMeals, setUserMeals] = useState(meals);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const { favoriteRecipes, removeFavoriteRecipe } = useFavoriteRecipes();
  
  // Add state for nutritional needs
  const [nutritionalNeeds, setNutritionalNeeds] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and nutritional needs
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to signup');
          navigate('/signup');
          return;
        }

        console.log('Fetching user profile with token:', token);
        const response = await fetch('http://127.0.0.1:8000/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.status === 401) {
          console.log('Token expired or invalid, redirecting to signup');
          localStorage.removeItem('token');
          navigate('/signup');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();
        console.log('Received user data:', userData);
        
        if (userData.profile && userData.profile.nutritional_needs) {
          setNutritionalNeeds(userData.profile.nutritional_needs);
          console.log('Set nutritional needs:', userData.profile.nutritional_needs);
        } else {
          console.log('No nutritional needs found in user data');
          setNutritionalNeeds(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setNutritionalNeeds(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Calculate total nutritional values from meals
  const calculateTotalNutrition = () => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    userMeals.forEach(meal => {
      if (meal.macros) {
        totals.calories += meal.macros.calories || 0;
        totals.protein += meal.macros.protein || 0;
        totals.carbs += meal.macros.carbs || 0;
        totals.fats += meal.macros.fats || 0;
        totals.fiber += meal.macros.fiber || 0;
        totals.sugar += meal.macros.sugar || 0;
        totals.sodium += meal.macros.sodium || 0;
      }
    });

    console.log("Calculated totals:", totals);
    return totals;
  };

  // Get current nutritional values
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

  // Fetch meals for the selected date
  const fetchMeals = async (date) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to signup");
        navigate("/signup");
        return;
      }

      const formattedDate = date.toISOString().split('T')[0];
      console.log("Fetching meals for date:", formattedDate);
      
      const response = await fetch(`http://127.0.0.1:8000/nutrition/meals/${formattedDate}`, {
        method: "GET",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log("Token expired or invalid, redirecting to signup");
          localStorage.removeItem("token");
          navigate("/signup");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received meals data:", data);
      setUserMeals(data.meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      setUserMeals([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch meals when date changes
  useEffect(() => {
    fetchMeals(currentDate);
  }, [currentDate]);

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

  const handleAddSupplement = () => {
    if (newSupplementName && newSupplementDose) {
      setUserSupplements([
        ...userSupplements,
        { name: newSupplementName, dose: newSupplementDose }
      ]);
      setNewSupplementName("");
      setNewSupplementDose("");
      setShowAddSupplement(false);
    }
  };

  const handleDeleteMeal = (mealId) => {
    setUserMeals(userMeals.filter(meal => meal.id !== mealId));
  };

  const getDayLoggedStreak = () => {
    // This would be calculated based on user's history
    return 15;
  };

  const handleToggleMeal = (mealId) => {
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  const handleToggleFavorite = (recipeTitle) => {
    removeFavoriteRecipe(recipeTitle);
  };

  // Progress Circle Component
  const ProgressCircle = ({ current, goal, label, unit }) => {
    const percentage = Math.min(Math.round((current / goal) * 100), 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
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
              stroke="#9d5e26"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold">{current}</span>
            <span className="text-xs text-zinc-400">{unit}</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-zinc-400">{goal} {unit}</div>
        </div>
      </div>
    );
  };

  // Health Score Bar Component
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

  // Add this new component for the calories bar
  const CaloriesBar = ({ current, goal }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold">Calories</h3>
            <p className="text-sm text-zinc-400">{current} / {goal} kcal</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{Math.round(percentage)}%</p>
          </div>
        </div>
        <div className="h-4 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#9d5e26] rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[200px] justify-center text-sm font-normal h-8 bg-black/50 border-zinc-700 text-white hover:bg-black/70"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getDateString(currentDate)}
                  {isToday(currentDate) && " (Today)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-black/90 border-zinc-700" align="center">
                <div className="p-3">
                  <p className="text-sm text-center text-zinc-400">Calendar will be implemented here</p>
                </div>
              </PopoverContent>
            </Popover>
            
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
                      goal={nutritionalNeeds.macros.protein.max} 
                      label="Protein" 
                      unit={nutritionalNeeds.macros.protein.unit} 
                    />
                    <ProgressCircle 
                      current={currentNutrition.carbs} 
                      goal={nutritionalNeeds.macros.carbs.max} 
                      label="Carbs" 
                      unit={nutritionalNeeds.macros.carbs.unit} 
                    />
                    <ProgressCircle 
                      current={currentNutrition.fats} 
                      goal={nutritionalNeeds.macros.fats.max} 
                      label="Fats" 
                      unit={nutritionalNeeds.macros.fats.unit} 
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
                      goal={nutritionalNeeds.other_nutrients.fiber.max} 
                      label="Fiber" 
                      unit={nutritionalNeeds.other_nutrients.fiber.unit} 
                    />
                    <ProgressCircle 
                      current={currentNutrition.sugar} 
                      goal={nutritionalNeeds.other_nutrients.sugar.max} 
                      label="Sugar" 
                      unit={nutritionalNeeds.other_nutrients.sugar.unit} 
                    />
                    <ProgressCircle 
                      current={currentNutrition.sodium} 
                      goal={nutritionalNeeds.other_nutrients.sodium.max} 
                      label="Sodium" 
                      unit={nutritionalNeeds.other_nutrients.sodium.unit} 
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
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-300" />
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
                {healthScores.map((score, index) => (
                  <HealthScoreBar key={index} {...score} />
                ))}
              </div>
              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-zinc-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-white">Micronutrient Focus</h3>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-400 hover:text-white">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 text-sm">
                  <Badge variant="outline" className="mr-1 bg-black/30 border-zinc-700 text-zinc-300">Iron</Badge>
                  <Badge variant="outline" className="mr-1 bg-black/30 border-zinc-700 text-zinc-300">Calcium</Badge>
                  <Badge variant="outline" className="mr-1 bg-black/30 border-zinc-700 text-zinc-300">Omega 3</Badge>
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
                
                {userSupplements.map((supplement, index) => (
                  <div key={index} className="flex items-center bg-black/30 rounded-lg p-3 border border-zinc-700">
                    <Pill className="h-4 w-4 text-zinc-400" />
                    <span className="ml-3 text-zinc-300">{supplement.name}</span>
                    <span className="ml-auto text-sm text-zinc-500">{supplement.dose}</span>
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
              <div className="space-y-2">
                {userMeals.map((meal) => (
                  <MealCard 
                    key={meal.id} 
                    meal={meal} 
                    onDelete={handleDeleteMeal}
                    expanded={expandedMealId === meal.id}
                    onToggle={() => handleToggleMeal(meal.id)}
                  />
                ))}
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
                        key={recipe.title}
                        {...recipe}
                        isFavorite={true}
                        onFavoriteToggle={() => handleToggleFavorite(recipe.title)}
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