import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Edit, Flame, HelpCircle, Home, Info, Pill, Plus, Settings, Utensils, BookOpen, BarChart2, Trash2 } from "lucide-react";
import { RecipeCard } from "../components/ui/RecipeCard";
import { MealCard } from "../components/MealCard/MealCard.tsx";
import Navbar from "../components/ui/Navbar";
import "./Dashboard.css";

// Placeholder data
const macroData = [
  { current: 2100, goal: 2800, label: "Calories", unit: "kcal", color: "var(--chart-1-hex)" },
  { current: 110, goal: 140, label: "Protein", unit: "g", color: "var(--chart-2-hex)" },
  { current: 230, goal: 300, label: "Carbs", unit: "g", color: "var(--chart-3-hex)" },
  { current: 60, goal: 80, label: "Fats", unit: "g", color: "var(--chart-4-hex)" },
  { current: 20, goal: 30, label: "Fiber", unit: "g", color: "var(--chart-5-hex)" },
  { current: 45, goal: 50, label: "Sugar", unit: "g", color: "var(--destructive-hex)" },
  { current: 1800, goal: 2300, label: "Sodium", unit: "mg", color: "#9d5e26" }
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

// Favorite recipes (reused from recipe page)
const favoriteRecipes = [
  {
    title: "Masala Dosa with Coconut Chutney",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&dpr=2&q=80",
    timeInMinutes: 45,
    spiceLevel: 2,
    pricePerPortion: 3.50,
    nutrition: {
      calories: 350,
      protein: 8,
      carbs: 62,
      fat: 8,
      fiber: 4
    },
    healthBenefits: ["High-Fiber", "Low-Fat"],
    culturalStyle: "South Indian"
  },
  {
    title: "Quinoa Biryani Bowl",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&dpr=2&q=80",
    timeInMinutes: 35,
    spiceLevel: 2,
    pricePerPortion: 4.20,
    nutrition: {
      calories: 420,
      protein: 15,
      carbs: 65,
      fat: 12,
      fiber: 8
    },
    healthBenefits: ["High-Protein", "Gluten-Free"],
    culturalStyle: "Fusion"
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newSupplementName, setNewSupplementName] = useState("");
  const [newSupplementDose, setNewSupplementDose] = useState("");
  const [userSupplements, setUserSupplements] = useState(supplements);
  const [userMeals, setUserMeals] = useState(meals);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [userFavoriteRecipes, setUserFavoriteRecipes] = useState(favoriteRecipes);
  
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
    setUserFavoriteRecipes(prevRecipes => 
      prevRecipes.filter(recipe => recipe.title !== recipeTitle)
    );
  };

  // Progress Circle Component
  const ProgressCircle = ({ current, goal, label, unit, color }) => {
    const percentage = Math.min(Math.round((current / goal) * 100), 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isExceeded = current > goal;
    
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-[100px] h-[100px]">
          {/* Background Circle */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="hsl(var(--border))"
              strokeWidth="8"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={isExceeded ? "var(--destructive-hex)" : color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          {/* Text in the middle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold">{current}</span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{goal} {unit}</div>
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
          <div className="flex items-center">
            <span className="text-sm">{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{info}</p>
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
              <div className="dashboard-macros-grid">
                {macroData.slice(0, 3).map((macro, index) => (
                  <ProgressCircle key={index} {...macro} />
                ))}
              </div>
              <Separator className="my-6 bg-zinc-700" />
              <div className="dashboard-macros-grid">
                {macroData.slice(3).map((macro, index) => (
                  <ProgressCircle key={index + 3} {...macro} />
                ))}
              </div>
            </Card>

            {/* Health Scores */}
            <Card className="dashboard-card bg-black/50 border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Health Scores</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>
                        <Info className="h-4 w-4 text-zinc-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-black/90 border-zinc-700">
                      <p className="max-w-xs text-sm text-zinc-300">These scores are calculated based on your food intake and provide a holistic view of your nutritional health.</p>
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
              <div className="dashboard-supplements-list">
                {userSupplements.map((supplement, index) => (
                  <div key={index} className="dashboard-supplement-item">
                    <Pill className="h-4 w-4 mr-2 text-zinc-400" />
                    <span className="dashboard-supplement-name text-zinc-300">{supplement.name}</span>
                    <span className="dashboard-supplement-dose text-zinc-500">{supplement.dose}</span>
                  </div>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full bg-black/30 border-zinc-700 text-zinc-300 hover:bg-black/50">
                    <Plus className="h-4 w-4 mr-2" /> Add Supplement
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-black/90 border-zinc-700">
                  <div className="dashboard-add-supplement-form">
                    <div className="space-y-2">
                      <h3 className="font-medium text-white">Add New Supplement</h3>
                      <div className="dashboard-supplement-inputs">
                        <div className="col-span-2">
                          <input 
                            type="text" 
                            value={newSupplementName}
                            onChange={(e) => setNewSupplementName(e.target.value)}
                            placeholder="Supplement name" 
                            className="dashboard-supplement-input bg-black/30 border-zinc-700 text-white placeholder:text-zinc-500"
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            value={newSupplementDose}
                            onChange={(e) => setNewSupplementDose(e.target.value)}
                            placeholder="Dose" 
                            className="dashboard-supplement-input bg-black/30 border-zinc-700 text-white placeholder:text-zinc-500"
                          />
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleAddSupplement} className="w-full mt-4">Add</Button>
                  </div>
                </PopoverContent>
              </Popover>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userFavoriteRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.title}
                    {...recipe}
                    isFavorite={true}
                    onFavoriteToggle={() => handleToggleFavorite(recipe.title)}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}