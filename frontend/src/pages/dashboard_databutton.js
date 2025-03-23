import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Edit, Flame, HelpCircle, Home, Info, Pill, Plus, Settings, Trash2, Utensils, BookOpen, BarChart2, Calendar } from "lucide-react";
import { RecipeCard } from "components/RecipeCard";

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

// Placeholder data
const macroData: MacroProgress[] = [
  { current: 2100, goal: 2800, label: "Calories", unit: "kcal", color: "var(--chart-1-hex)" },
  { current: 110, goal: 140, label: "Protein", unit: "g", color: "var(--chart-2-hex)" },
  { current: 230, goal: 300, label: "Carbs", unit: "g", color: "var(--chart-3-hex)" },
  { current: 60, goal: 80, label: "Fats", unit: "g", color: "var(--chart-4-hex)" },
  { current: 20, goal: 30, label: "Fiber", unit: "g", color: "var(--chart-5-hex)" },
  { current: 45, goal: 50, label: "Sugar", unit: "g", color: "var(--destructive-hex)" },
  { current: 1800, goal: 2300, label: "Sodium", unit: "mg", color: "#9d5e26" }
];

const healthScores: HealthScore[] = [
  { score: 75, label: "Glycemic Index", info: "Measures how quickly foods raise blood sugar levels. Lower scores are better for stable energy.", colorScale: "lowGood" },
  { score: 30, label: "Inflammatory Score", info: "Indicates how likely foods are to cause inflammation. Lower scores mean less inflammatory.", colorScale: "lowGood" },
  { score: 85, label: "Heart Health Score", info: "Evaluates food impact on cardiovascular health. Higher scores are better for heart health.", colorScale: "highGood" },
  { score: 70, label: "Digestive Score", info: "Rates how easy foods are to digest and their effect on gut health. Higher scores indicate better digestive support.", colorScale: "highGood" },
  { score: 80, label: "Meal Balance Score", info: "Measures overall nutritional balance across all food groups. Higher scores indicate better balanced meals.", colorScale: "highGood" },
];

const supplements: Supplement[] = [
  { name: "Vitamin D3", dose: "2000 IU" },
  { name: "Omega 3 Fish Oil", dose: "1000mg" },
  { name: "Magnesium Citrate", dose: "200mg" },
  { name: "Vitamin B Complex", dose: "1 tablet" },
];

const meals: Meal[] = [
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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [newSupplementName, setNewSupplementName] = useState("");
  const [newSupplementDose, setNewSupplementDose] = useState("");
  const [userSupplements, setUserSupplements] = useState<Supplement[]>(supplements);
  
  // UI Helper Functions
  const toggleMealExpansion = (mealId: string) => {
    if (expandedMeal === mealId) {
      setExpandedMeal(null);
    } else {
      setExpandedMeal(mealId);
    }
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDateString = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const isToday = (date: Date) => {
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

  const getDayLoggedStreak = () => {
    // This would be calculated based on user's history
    return 15;
  };

  // Progress Circle Component
  const ProgressCircle = ({ current, goal, label, unit, color }: MacroProgress) => {
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
  const HealthScoreBar = ({ score, label, info, colorScale }: HealthScore) => {
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

  // Component for meal card with expansion
  const MealCard = ({ meal }: { meal: Meal }) => {
    const isExpanded = expandedMeal === meal.id;
    
    return (
      <Card className="w-full mb-4 bg-black/40 backdrop-blur-sm border border-zinc-800 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start">
            <div className="w-16 h-16 rounded overflow-hidden mr-4 flex-shrink-0">
              <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-medium">{meal.name}</h3>
                <span className="text-sm text-muted-foreground">{meal.time}</span>
              </div>
              <div className="flex flex-wrap mt-2 gap-1.5">
                {meal.tags.map((tag, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="bg-zinc-900/70 text-xs font-normal"
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
            onClick={() => toggleMealExpansion(meal.id)} 
            className="w-full mt-2 text-muted-foreground"
          >
            {isExpanded ? "Hide Details" : "View Insights"}
            <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {/* Expandable content */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-4 pt-0 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
              <h4 className="col-span-2 text-sm font-medium mb-1">Nutrition</h4>
              <div className="text-xs">Calories: {meal.macros.calories}kcal</div>
              <div className="text-xs">Protein: {meal.macros.protein}g</div>
              <div className="text-xs">Carbs: {meal.macros.carbs}g</div>
              <div className="text-xs">Fats: {meal.macros.fats}g</div>
              <div className="text-xs">Fiber: {meal.macros.fiber}g</div>
              <div className="text-xs">Sugar: {meal.macros.sugar}g</div>
              <div className="text-xs">Sodium: {meal.macros.sodium}mg</div>
            </div>

            <h4 className="text-sm font-medium mb-2">Meal Balance</h4>
            <div className="relative h-4 w-full bg-zinc-800 rounded-full mb-4">
              {/* Protein */}
              <div className="absolute h-full rounded-l-full bg-emerald-500" 
                style={{ width: `${meal.macros.protein / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100}%` }}></div>
              {/* Carbs */}
              <div className="absolute h-full bg-blue-500" 
                style={{ 
                  left: `${meal.macros.protein / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100}%`,
                  width: `${meal.macros.carbs / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100}%` 
                }}></div>
              {/* Fats */}
              <div className="absolute h-full rounded-r-full bg-amber-500" 
                style={{ 
                  left: `${(meal.macros.protein + meal.macros.carbs) / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100}%`,
                  width: `${meal.macros.fats / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100}%` 
                }}></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-4">
              <span>Protein {Math.round(meal.macros.protein / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100)}%</span>
              <span>Carbs {Math.round(meal.macros.carbs / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100)}%</span>
              <span>Fats {Math.round(meal.macros.fats / (meal.macros.protein + meal.macros.carbs + meal.macros.fats) * 100)}%</span>
            </div>

            <h4 className="text-sm font-medium mb-2">Health Scores</h4>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs">Glycemic Index:</span>
                <div className="w-28 bg-zinc-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${meal.healthScores.glycemic <= 50 ? 'bg-emerald-500' : meal.healthScores.glycemic <= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${meal.healthScores.glycemic}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Inflammatory:</span>
                <div className="w-28 bg-zinc-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${meal.healthScores.inflammatory <= 30 ? 'bg-emerald-500' : meal.healthScores.inflammatory <= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${meal.healthScores.inflammatory}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Heart Health:</span>
                <div className="w-28 bg-zinc-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${meal.healthScores.heart >= 80 ? 'bg-emerald-500' : meal.healthScores.heart >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${meal.healthScores.heart}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Digestive Health:</span>
                <div className="w-28 bg-zinc-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${meal.healthScores.digestive >= 80 ? 'bg-emerald-500' : meal.healthScores.digestive >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${meal.healthScores.digestive}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Balance Score:</span>
                <div className="w-28 bg-zinc-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${meal.healthScores.balance >= 80 ? 'bg-emerald-500' : meal.healthScores.balance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${meal.healthScores.balance}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Meal
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home className="w-5 h-5 mr-2" />
              Home
            </Button>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" disabled title="Coming soon">
                <Utensils className="w-5 h-5 mr-2" />
                Log Meal
              </Button>
              <Button variant="default" onClick={() => navigate("/dashboard")}>
                <BarChart2 className="w-5 h-5 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" disabled title="Coming soon">
                <BookOpen className="w-5 h-5 mr-2" />
                EatWell Guide
              </Button>
              <Button variant="ghost" onClick={() => navigate("/recipes")}>
                <Utensils className="w-5 h-5 mr-2" />
                Browse Recipes
              </Button>
              <Button variant="ghost" disabled title="Coming soon">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Nutrition Dashboard</h1>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDay('prev')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[200px] justify-center text-sm font-normal h-8"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getDateString(currentDate)}
                  {isToday(currentDate) && " (Today)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                {/* Insert Calendar component here */}
                <div className="p-3">
                  <p className="text-sm text-center text-muted-foreground">Calendar will be implemented here</p>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDay('next')}
              className="h-8 w-8"
              disabled={isToday(currentDate)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Dashboard UI */}
          <div className="space-y-6">
            {/* Streak Tracker */}
            <Card className="p-4 bg-black/40 backdrop-blur-sm border border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Progress</h2>
                <div className="flex items-center gap-1.5 bg-amber-900/30 text-amber-300 px-3 py-1 rounded-full">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{getDayLoggedStreak()} Days Logged</span>
                </div>
              </div>
            </Card>

            {/* Macronutrient Progress */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Daily Macronutrients</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {macroData.slice(0, 3).map((macro, index) => (
                  <ProgressCircle key={index} {...macro} />
                ))}
              </div>
              <Separator className="my-6" />
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6">
                {macroData.slice(3).map((macro, index) => (
                  <ProgressCircle key={index + 3} {...macro} />
                ))}
              </div>
            </Card>

            {/* Health Scores */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Health Scores</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="max-w-xs text-sm">These scores are calculated based on your food intake and provide a holistic view of your nutritional health.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-4">
                {healthScores.map((score, index) => (
                  <HealthScoreBar key={index} {...score} />
                ))}
              </div>
              <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Micronutrient Focus</h3>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 text-sm">
                  <Badge variant="outline" className="mr-1 bg-zinc-800">Iron</Badge>
                  <Badge variant="outline" className="mr-1 bg-zinc-800">Calcium</Badge>
                  <Badge variant="outline" className="mr-1 bg-zinc-800">Omega 3</Badge>
                </div>
              </div>
            </Card>

            {/* Supplements Tracker */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Daily Supplements</h2>
              <div className="space-y-2 mb-4">
                {userSupplements.map((supplement, index) => (
                  <div key={index} className="flex items-center">
                    <Pill className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{supplement.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{supplement.dose}</span>
                  </div>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add Supplement
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Add New Supplement</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input 
                            type="text" 
                            value={newSupplementName}
                            onChange={(e) => setNewSupplementName(e.target.value)}
                            placeholder="Supplement name" 
                            className="w-full px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900"
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            value={newSupplementDose}
                            onChange={(e) => setNewSupplementDose(e.target.value)}
                            placeholder="Dose" 
                            className="w-full px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900"
                          />
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleAddSupplement}>Add</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </Card>
          </div>

          {/* Center & Right Sections - Meal Diary and Saved Recipes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meal Diary */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Meal Diary</h2>
              <div className="space-y-2">
                {meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </Card>

            {/* Saved Recipes */}
            <Card className="p-6 bg-black/40 backdrop-blur-sm border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Saved Recipes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={index}
                    {...recipe}
                    isFavorite={true}
                    onFavoriteToggle={() => {}}
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