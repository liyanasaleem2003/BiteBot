import React, { useState } from "react";
import "./Signup.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import homeBackground from "../images/home_background.jpg";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button-ui";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

// Health issues for multi-select
const healthIssueOptions = [
  { id: "diabetes", label: "Diabetes" },
  { id: "heart-disease", label: "Heart Disease" },
  { id: "hypertension", label: "Hypertension" },
  { id: "cholesterol", label: "High Cholesterol" },
  { id: "thyroid", label: "Thyroid Issues" },
  { id: "digestive", label: "Digestive Issues" },
  { id: "respiratory", label: "Respiratory Conditions" },
  { id: "arthritis", label: "Arthritis" },
  { id: "none", label: "None of the above" },
];

// Foods to avoid options
const foodsToAvoidOptions = [
  { id: "dairy", label: "Dairy" },
  { id: "gluten", label: "Gluten" },
  { id: "nuts", label: "Nuts" },
  { id: "shellfish", label: "Shellfish" },
  { id: "soy", label: "Soy" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "red-meat", label: "Red Meat" },
  { id: "processed-foods", label: "Processed Foods" },
  { id: "sugar", label: "Refined Sugar" },
];

// Micronutrient tracking options
const micronutrientOptions = [
  { id: "iron", label: "Iron" },
  { id: "calcium", label: "Calcium" },
  { id: "omega3", label: "Omega-3" },
  { id: "vitaminD", label: "Vitamin D" },
  { id: "vitaminB12", label: "Vitamin B12" },
  { id: "magnesium", label: "Magnesium" },
  { id: "potassium", label: "Potassium" },
  { id: "zinc", label: "Zinc" },
];

// Health goals options
const healthGoalOptions = [
  { id: "diabetes", label: "Manage diabetes" },
  { id: "muscle", label: "Build muscle" },
  { id: "heart", label: "Improve heart health" },
  { id: "immunity", label: "Boost immunity" },
  { id: "digestive", label: "Enhance digestive health" },
  { id: "skin-joint", label: "Improve skin/joint health" },
  { id: "cellular", label: "Improve cellular health" },
];

// Dietary preference options
const dietaryOptions = ["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Lactose-Free", "Gluten-Free"];

const Signup = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("welcome");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [currentStep, setCurrentStep] = useState(1);
  
  // Signup form data
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    height: "",
    weight: "",
    healthIssues: [],
    dietaryPreference: [],
    mealsPerDay: "3",
    foodsToAvoid: [],
    micronutrients: [],
    healthGoals: []
  });

  // Login form data
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  // Handle login form input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle signup form input changes
  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for multi-select options
  const handleCheckboxChange = (id, field) => {
    setSignupForm(prev => {
      // Ensure the field is an array
      const currentValues = Array.isArray(prev[field]) ? [...prev[field]] : [];
      
      if (currentValues.includes(id)) {
        return {
          ...prev,
          [field]: currentValues.filter(item => item !== id)
        };
      } else {
        return {
          ...prev,
          [field]: [...currentValues, id]
        };
      }
    });
  };
  
  // Handle radio group changes
  const handleRadioChange = (value, field) => {
    setSignupForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (value, field) => {
    setSignupForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle health goals selection (limit to 3)
  const handleHealthGoalChange = (id) => {
    setSignupForm(prev => {
      const currentGoals = [...prev.healthGoals];
      
      if (currentGoals.includes(id)) {
        return {
          ...prev,
          healthGoals: currentGoals.filter(goal => goal !== id)
        };
      } else if (currentGoals.length < 3) {
        return {
          ...prev,
          healthGoals: [...currentGoals, id]
        };
      }
      return prev;
    });
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle multi-step signup navigation
  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle final signup submission
  const handleSignupComplete = async (e) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
  
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password,
          profile: {
            dob: signupForm.dob,
            height: signupForm.height,
            weight: signupForm.weight,
            healthIssues: signupForm.healthIssues,
            dietaryPreference: signupForm.dietaryPreference,
            mealsPerDay: signupForm.mealsPerDay,
            foodsToAvoid: signupForm.foodsToAvoid,
            micronutrients: signupForm.micronutrients,
            healthGoals: signupForm.healthGoals,
          },
        }),
      });
  
      if (response.ok) {
        alert("Signup Successful!");
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="signup-container"
      style={{
        backgroundImage: `url(${homeBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Left Section for Title and Summary */}
      {currentView === "welcome" && (
        <div className="left-section">
          <h1 className="title">BiteBot</h1>
          <p className="subheading">
            Your personal cultural nutrition guide. Discover personalized meal
            suggestions and wellness advice that respect your heritage.
          </p>
          <button
            className="get-started-button"
            style={{ width: "200px", marginBottom: "10px" }}
            onClick={() => setCurrentView("signup")}
          >
            Get Started
          </button>
          <p
            className="login-link"
            style={{ textAlign: "center" }}
            onClick={() => {
              setCurrentView("signup");
              setActiveTab("login");
            }}
          >
            Already have an account? <span>Log In</span>
          </p>
        </div>
      )}

      {/* Right Section for Forms */}
      <div
        className={`form-section ${currentView === "signup" ? "visible" : ""}`}
        style={{
          paddingLeft: "20px",
        }}
      >
        <Card className="w-full max-w-md p-6 shadow-lg border-primary/10 overflow-hidden">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full mt-6">
                  Login
                </Button>
              </form>
              <p
                className="login-link"
                style={{ textAlign: "center" }}
                onClick={() => setActiveTab("signup")}
              >
                Don't have an account? <span>Sign up!</span>
              </p>
            </TabsContent>

            {/* Signup Form - Multi-step */}
            <TabsContent value="signup" className="space-y-4">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div 
                      key={step}
                      className={`h-2 rounded-full flex-1 mx-1 transition-colors ${currentStep >= step ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Step {currentStep} of 5
                </p>
              </div>
              
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name/Nickname</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      value={signupForm.name}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signupForm.password}
                        onChange={handleSignupChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    className="w-full mt-6"
                    onClick={nextStep}
                  >
                    Next
                  </Button>
                </form>
              )}
              
              {/* Step 2: Profile Information */}
              {currentStep === 2 && (
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      value={signupForm.dob}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      placeholder="Enter your height in centimeters"
                      value={signupForm.height}
                      onChange={handleSignupChange}
                      required
                      min="1"
                      max="300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      placeholder="Enter your weight in kilograms"
                      value={signupForm.weight}
                      onChange={handleSignupChange}
                      required
                      min="1"
                      max="500"
                    />
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                    >
                      Next
                    </Button>
                  </div>
                </form>
              )}
              
              {/* Step 3: Health Details */}
              {currentStep === 3 && (
                <div className="scrollable-signup-container">
                  <form className="space-y-4">
                    {/* Dietary Preference */}
                    <div className="space-y-2">
                      <Label>Dietary Preference (Max 2)</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select up to 2 preferences</p>
                      <div className="grid">
                        {dietaryOptions.map((option) => (
                          <div 
                            key={option} 
                            className={`filter-button ${signupForm.dietaryPreference.includes(option) ? 'selected' : ''}`}
                            onClick={() => {
                              const newPreferences = [...signupForm.dietaryPreference];
                              if (newPreferences.includes(option)) {
                                setSignupForm(prev => ({
                                  ...prev,
                                  dietaryPreference: newPreferences.filter(pref => pref !== option)
                                }));
                              } else if (newPreferences.length < 2) {
                                setSignupForm(prev => ({
                                  ...prev,
                                  dietaryPreference: [...newPreferences, option]
                                }));
                              }
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Foods to Avoid */}
                    <div className="space-y-2">
                      <Label>Foods to Avoid</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                      <div className="grid">
                        {foodsToAvoidOptions.map((option) => (
                          <div 
                            key={option.id} 
                            className={`filter-button ${signupForm.foodsToAvoid.includes(option.id) ? 'selected' : ''}`}
                            onClick={() => handleCheckboxChange(option.id, "foodsToAvoid")}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Meals Per Day */}
                    <div className="space-y-2">
                      <Label htmlFor="meals-per-day">Meals Per Day</Label>
                      <Select 
                        value={signupForm.mealsPerDay}
                        onValueChange={(value) => handleSelectChange(value, "mealsPerDay")}
                      >
                        <SelectTrigger id="meals-per-day">
                          <SelectValue placeholder="Select number of meals" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? "meal" : "meals"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Micronutrient Tracking */}
                    <div className="space-y-2">
                      <Label>Priority Micronutrients to Track</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select nutrients you want to track</p>
                      <div className="grid">
                        {micronutrientOptions.map((option) => (
                          <div 
                            key={option.id} 
                            className={`filter-button ${signupForm.micronutrients.includes(option.id) ? 'selected' : ''}`}
                            onClick={() => handleCheckboxChange(option.id, "micronutrients")}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Personal Health History */}
                    <div className="health-section">
                      <h3>Personal Health History</h3>
                      <div className="health-history-grid">
                        {healthIssueOptions.map((option) => (
                          <div key={option.id} className="health-history-item">
                            <Checkbox 
                              id={`personal-${option.id}`}
                              checked={signupForm.healthIssues.includes(option.id)}
                              onCheckedChange={() => handleCheckboxChange(option.id, "healthIssues")}
                            />
                            <Label htmlFor={`personal-${option.id}`}>
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Family Health History */}
                    <div className="health-section">
                      <h3>Family Health History</h3>
                      <div className="health-history-grid">
                        {healthIssueOptions.map((option) => (
                          <div key={option.id} className="health-history-item">
                            <Checkbox 
                              id={`family-${option.id}`}
                              checked={signupForm.familyHealthIssues?.includes(option.id)}
                              onCheckedChange={() => handleCheckboxChange(option.id, "familyHealthIssues")}
                            />
                            <Label htmlFor={`family-${option.id}`}>
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={nextStep}
                      >
                        Next
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Step 4: Health Goals */}
              {currentStep === 4 && (
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Up to 3 Health Goals</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {signupForm.healthGoals.length === 3 
                        ? "Maximum 3 goals selected" 
                        : `${3 - signupForm.healthGoals.length} more goal${3 - signupForm.healthGoals.length !== 1 ? "s" : ""} can be selected`}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {healthGoalOptions.map((goal) => {
                        const isSelected = signupForm.healthGoals.includes(goal.id);
                        return (
                          <div 
                            key={goal.id}
                            className={`p-3 rounded-lg border ${isSelected ? 'border-primary bg-primary/10' : 'border-border'} transition-colors cursor-pointer`}
                            onClick={() => handleHealthGoalChange(goal.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`goal-${goal.id}`}
                                checked={isSelected}
                                disabled={signupForm.healthGoals.length >= 3 && !isSelected}
                              />
                              <Label htmlFor={`goal-${goal.id}`} className="text-sm font-medium">
                                {goal.label}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                    >
                      Next
                    </Button>
                  </div>
                </form>
              )}
              
              {/* Step 5: Terms & Conditions */}
              {currentStep === 5 && (
                <form onSubmit={handleSignupComplete} className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      By creating an account, you agree to our Terms of Service and Privacy Policy. BiteBot collects and processes your data according to GDPR guidelines to provide personalized nutrition recommendations.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I accept the Terms & Conditions
                    </Label>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button type="submit">
                      Create Account
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </Card>
        <div 
          className="back-to-welcome" 
          onClick={() => setCurrentView("welcome")}
        >
          Back to Welcome
        </div>
      </div>
    </div>
  );
};

export default Signup;