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
import { API_BASE_URL } from '../config';

// Health issues for multi-select
const healthIssueOptions = [
  { id: "diabetes", label: "Type 2 Diabetes / Prediabetes" },
  { id: "hypertension", label: "Hypertension (High Blood Pressure)" },
  { id: "cholesterol", label: "High Cholesterol (Hyperlipidemia)" },
  { id: "anemia", label: "Iron-Deficiency Anemia" },
  { id: "vitaminD", label: "Vitamin D Deficiency / Osteoporosis" },
  { id: "lactose_intolerance", label: "Lactose Intolerance" },
  { id: "acidReflux", label: "Acid Reflux / GERD" },
  { id: "ibs", label: "IBS / Digestive Issues" },
  { id: "arthritis", label: "Joint Pain / Arthritis" }
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
  { id: "red-meat", label: "Red Meat" }
];

// Micronutrient tracking options with recommendations
const micronutrientOptions = [
  { 
    id: "iron", 
    label: "Iron",
    recommendations: ["Iron-Deficiency Anemia"],
    description: "Essential for red blood cell production and oxygen transport"
  },
  { 
    id: "vitaminB12", 
    label: "Vitamin B12",
    recommendations: ["Iron-Deficiency Anemia", "Vegetarian"],
    description: "Crucial for nerve function and red blood cell formation"
  },
  { 
    id: "folate", 
    label: "Folate (B9)",
    recommendations: ["Iron-Deficiency Anemia"],
    description: "Important for cell division and DNA synthesis"
  },
  { 
    id: "vitaminD", 
    label: "Vitamin D",
    recommendations: ["Vitamin D Deficiency / Osteoporosis"],
    description: "Helps calcium absorption and bone health"
  },
  { 
    id: "calcium", 
    label: "Calcium",
    recommendations: ["Vitamin D Deficiency / Osteoporosis", "Lactose Intolerance"],
    description: "Essential for bone strength and muscle function"
  },
  { 
    id: "omega3", 
    label: "Omega-3",
    recommendations: ["High Cholesterol (Hyperlipidemia)", "Joint Pain / Arthritis"],
    description: "Supports heart health and reduces inflammation"
  },
  { 
    id: "potassium", 
    label: "Potassium",
    recommendations: ["Hypertension (High Blood Pressure)"],
    description: "Helps regulate blood pressure and fluid balance"
  },
  { 
    id: "magnesium", 
    label: "Magnesium",
    recommendations: ["Hypertension (High Blood Pressure)", "Vitamin D Deficiency / Osteoporosis"],
    description: "Supports bone health and blood pressure regulation"
  },
  { 
    id: "zinc", 
    label: "Zinc",
    recommendations: ["IBS / Digestive Issues"],
    description: "Important for immune function and digestive health"
  }
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

// Activity level options
const activityLevelOptions = [
  { id: "sedentary", label: "Sedentary (little or no exercise)" },
  { id: "light", label: "Lightly active (light exercise/sports 1-3 days/week)" },
  { id: "moderate", label: "Moderately active (moderate exercise/sports 3-5 days/week)" },
  { id: "very", label: "Very active (hard exercise/sports 6-7 days/week)" },
  { id: "extra", label: "Extra active (very hard exercise/sports & physical job or training twice per day)" }
];

// Health condition recommendations with detailed messages
const healthConditionRecommendations = {
  "diabetes": {
    title: "Type 2 Diabetes / Prediabetes",
    nutrients: ["potassium", "magnesium", "omega3"],
    message: "These nutrients help manage blood sugar levels and support heart health. Consider tracking these to optimize your diet!",
    details: "Potassium and magnesium help with insulin sensitivity, while omega-3 supports cardiovascular health which is important for diabetes management."
  },
  "anemia": {
    title: "Iron-Deficiency Anemia",
    nutrients: ["iron", "vitaminB12", "folate"],
    message: "People with anemia often have low iron and B12 levels. Consider tracking these to optimize your diet!",
    details: "Iron is essential for red blood cell production, while B12 and folate support healthy blood formation."
  },
  "hypertension": {
    title: "Hypertension (High Blood Pressure)",
    nutrients: ["potassium", "magnesium", "omega3"],
    message: "Potassium and Magnesium help regulate blood pressure. Omega-3 supports heart health. Consider tracking these!",
    details: "These nutrients work together to maintain healthy blood pressure levels and cardiovascular function."
  },
  "vitaminD": {
    title: "Vitamin D Deficiency / Osteoporosis",
    nutrients: ["vitaminD", "calcium", "magnesium"],
    message: "Vitamin D helps your body absorb calcium for strong bones. Magnesium supports bone density!",
    details: "This combination of nutrients is crucial for maintaining strong bones and preventing bone loss."
  },
  "cholesterol": {
    title: "High Cholesterol (Hyperlipidemia)",
    nutrients: ["omega3", "potassium", "magnesium"],
    message: "Omega-3 fatty acids help manage cholesterol levels. Potassium and magnesium support heart health!",
    details: "These nutrients work together to maintain healthy cholesterol levels and cardiovascular function."
  },
  "lactose_intolerance": {
    title: "Lactose Intolerance",
    nutrients: ["calcium", "vitaminD", "magnesium"],
    message: "Since dairy is limited, focus on calcium-rich alternatives and supporting nutrients!",
    details: "These nutrients help maintain bone health without relying on dairy sources."
  },
  "acidReflux": {
    title: "Acid Reflux / GERD",
    nutrients: ["magnesium", "zinc", "vitaminB12"],
    message: "These nutrients support digestive health and help maintain proper stomach acid levels!",
    details: "Magnesium helps relax the esophageal sphincter, while zinc and B12 support digestive function."
  },
  "ibs": {
    title: "IBS / Digestive Issues",
    nutrients: ["zinc", "magnesium", "vitaminB12"],
    message: "These nutrients support digestive health and help maintain gut function!",
    details: "Zinc supports gut lining health, while magnesium helps with muscle relaxation and B12 supports nerve function."
  },
  "arthritis": {
    title: "Joint Pain / Arthritis",
    nutrients: ["omega3", "vitaminD", "magnesium"],
    message: "Omega-3 reduces inflammation, while Vitamin D and Magnesium support joint health!",
    details: "These nutrients work together to reduce inflammation and maintain joint function."
  }
};

const Signup = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("welcome");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
    healthGoals: [],
    sex: "",
    activity_level: ""
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
    setLoginLoading(true);
    setError(null);
    
    const formData = new URLSearchParams();
    formData.append('username', loginForm.email);
    formData.append('password', loginForm.password);

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        // Store the token with Bearer prefix
        localStorage.setItem('token', `Bearer ${data.access_token}`);
        console.log('Token stored:', `Bearer ${data.access_token}`);
        
        // Redirect to dashboard
        navigate('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        setError(error.message);
    } finally {
        setLoginLoading(false);
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
    setSignupLoading(true);
    setError(null);
    console.log("Starting registration process...");
    
    try {
        // Validate password match
        if (signupForm.password !== signupForm.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signupForm.email)) {
            alert("Please enter a valid email address");
            return;
        }

        // Validate password length
        if (signupForm.password.length < 8) {
            alert("Password must be at least 8 characters long");
            return;
        }

        // Calculate age from date of birth
        const today = new Date();
        const birthDate = new Date(signupForm.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // Validate all required fields
        if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.dob || !signupForm.height || !signupForm.weight || !signupForm.sex || !signupForm.activity_level) {
            alert("Please fill in all required fields");
            return;
        }

        // Format user data according to backend model
        const userData = {
            email: signupForm.email,
            first_name: signupForm.name,
            password: signupForm.password,
            profile: {
                date_of_birth: signupForm.dob,
                age: age,
                sex: signupForm.sex,
                height: {
                    value: parseFloat(signupForm.height),
                    unit: "cm"
                },
                weight: {
                    value: parseFloat(signupForm.weight),
                    unit: "kg"
                },
                activity_level: signupForm.activity_level,
                personal_health_history: signupForm.healthIssues || [],
                family_health_history: signupForm.familyHealthIssues || [],
                priority_micronutrients: signupForm.micronutrients || [],
                dietary_preferences: signupForm.dietaryPreference || [],
                meals_per_day: Number(signupForm.mealsPerDay),
                foods_to_avoid: signupForm.foodsToAvoid || [],
                health_goals: signupForm.healthGoals || []
            }
        };

        console.log("Sending registration request with data:", userData);

        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }

        console.log("Registration successful:", data);
        
        // Add a small delay before attempting login
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // After successful registration, log in the user
        console.log("Attempting login with credentials:", {
            username: signupForm.email,
            password: "[REDACTED]"
        });

        // Create form data for login
        const formData = new URLSearchParams();
        formData.append('username', signupForm.email);
        formData.append('password', signupForm.password);

        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok) {
            console.error("Login failed:", loginResult);
            let errorMessage = 'Registration successful but login failed';
            
            if (loginResult.detail) {
                if (Array.isArray(loginResult.detail)) {
                    errorMessage = loginResult.detail.map(err => err.msg || err).join(', ');
                } else {
                    errorMessage = loginResult.detail;
                }
            }
            
            throw new Error(errorMessage);
        }

        console.log("Login successful:", loginResult);
        localStorage.setItem('token', loginResult.access_token);
        navigate('/');
    } catch (error) {
        console.error("Registration error:", error);
        setError(error.message || "Registration failed. Please try again.");
    } finally {
        setSignupLoading(false);
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
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#D4E157] hover:bg-[#DCE775] text-black font-medium"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Logging in...
                    </div>
                  ) : (
                    'Login'
                  )}
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
                    <Label htmlFor="sex">Sex</Label>
                    <Select 
                      value={signupForm.sex}
                      onValueChange={(value) => handleSelectChange(value, "sex")}
                    >
                      <SelectTrigger className="select-trigger" id="sex">
                        <SelectValue placeholder="Select your sex" />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
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

                  <div className="space-y-2">
                    <Label htmlFor="activity_level">Activity Level</Label>
                    <Select 
                      value={signupForm.activity_level}
                      onValueChange={(value) => handleSelectChange(value, "activity_level")}
                    >
                      <SelectTrigger className="select-trigger" id="activity_level">
                        <SelectValue placeholder="Select your activity level" />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        {activityLevelOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    {/* Personal Health History */}
                    <div className="health-section">
                      <h3>Personal Health History</h3>
                      <p className="text-xs text-muted-foreground mb-2">Select up to 3 conditions that apply to you</p>
                      <div className="health-history-grid">
                        {healthIssueOptions.map((option) => (
                          <div key={option.id} className="health-history-item">
                            <Checkbox 
                              id={`personal-${option.id}`}
                              checked={signupForm.healthIssues.includes(option.id)}
                              onCheckedChange={() => {
                                if (signupForm.healthIssues.includes(option.id)) {
                                  handleCheckboxChange(option.id, "healthIssues");
                                } else if (signupForm.healthIssues.length < 3) {
                                  handleCheckboxChange(option.id, "healthIssues");
                                }
                              }}
                              disabled={signupForm.healthIssues.length >= 3 && !signupForm.healthIssues.includes(option.id)}
                            />
                            <Label htmlFor={`personal-${option.id}`}>
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="other-condition">Other (please specify)</Label>
                        <Input
                          id="other-condition"
                          placeholder="Enter other health conditions"
                          value={signupForm.otherHealthIssues || ""}
                          onChange={(e) => setSignupForm(prev => ({
                            ...prev,
                            otherHealthIssues: e.target.value
                          }))}
                        />
                      </div>
                      <div className="mt-2">
                        <div className="health-history-item">
                          <Checkbox 
                            id="personal-none"
                            checked={signupForm.healthIssues.includes("none")}
                            onCheckedChange={() => {
                              if (signupForm.healthIssues.includes("none")) {
                                handleCheckboxChange("none", "healthIssues");
                              } else {
                                // If selecting "none", clear all other selections
                                setSignupForm(prev => ({
                                  ...prev,
                                  healthIssues: ["none"]
                                }));
                              }
                            }}
                          />
                          <Label htmlFor="personal-none">
                            None of the above
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Family Health History */}
                    <div className="health-section">
                      <h3>Family Health History</h3>
                      <p className="text-xs text-muted-foreground mb-2">Select up to 3 conditions that run in your family</p>
                      <div className="health-history-grid">
                        {healthIssueOptions
                          .filter(option => option.id !== "acidReflux") // Remove acid reflux from family history
                          .map((option) => (
                            <div key={option.id} className="health-history-item">
                              <Checkbox 
                                id={`family-${option.id}`}
                                checked={signupForm.familyHealthIssues?.includes(option.id)}
                                onCheckedChange={() => {
                                  if (signupForm.familyHealthIssues?.includes(option.id)) {
                                    handleCheckboxChange(option.id, "familyHealthIssues");
                                  } else if (!signupForm.familyHealthIssues || signupForm.familyHealthIssues.length < 3) {
                                    handleCheckboxChange(option.id, "familyHealthIssues");
                                  }
                                }}
                                disabled={signupForm.familyHealthIssues?.length >= 3 && !signupForm.familyHealthIssues.includes(option.id)}
                              />
                              <Label htmlFor={`family-${option.id}`}>
                                {option.label}
                              </Label>
                            </div>
                          ))}
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="family-other-condition">Other (please specify)</Label>
                        <Input
                          id="family-other-condition"
                          placeholder="Enter other family health conditions"
                          value={signupForm.otherFamilyHealthIssues || ""}
                          onChange={(e) => setSignupForm(prev => ({
                            ...prev,
                            otherFamilyHealthIssues: e.target.value
                          }))}
                        />
                      </div>
                      <div className="mt-2">
                        <div className="health-history-item">
                          <Checkbox 
                            id="family-none"
                            checked={signupForm.familyHealthIssues?.includes("none")}
                            onCheckedChange={() => {
                              if (signupForm.familyHealthIssues?.includes("none")) {
                                handleCheckboxChange("none", "familyHealthIssues");
                              } else {
                                // If selecting "none", clear all other selections
                                setSignupForm(prev => ({
                                  ...prev,
                                  familyHealthIssues: ["none"]
                                }));
                              }
                            }}
                          />
                          <Label htmlFor="family-none">
                            None of the above
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Micronutrient Selection */}
                    <div className="space-y-2">
                      <Label>Priority Micronutrients to Track</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select up to 3 micronutrients to track based on your health conditions</p>
                      
                      {/* Smart Recommendations based on health conditions */}
                      {(signupForm.healthIssues.length > 0 || signupForm.familyHealthIssues?.length > 0) && (
                        <div className="recommendations-box mb-4">
                          <h4 className="text-sm font-medium mb-2">Smart Recommendations</h4>
                          {/* Personal Health History Recommendations */}
                          {signupForm.healthIssues.map(issueId => {
                            const recommendation = healthConditionRecommendations[issueId];
                            if (recommendation) {
                              return (
                                <div key={`personal-${issueId}`} className="recommendation-item">
                                  <div className="recommendation-header">
                                    <span className="recommendation-icon">👤</span>
                                    <h5 className="recommendation-title">{recommendation.title} (Personal)</h5>
                                  </div>
                                  <div className="recommendation-content">
                                    <div className="recommendation-nutrients">
                                      <span className="recommendation-icon">🔹</span>
                                      <span>Suggested Micronutrients: </span>
                                      {recommendation.nutrients.map(nutrientId => {
                                        const nutrient = micronutrientOptions.find(n => n.id === nutrientId);
                                        return nutrient ? nutrient.label : '';
                                      }).join(", ")}
                                    </div>
                                    <div className="recommendation-message">
                                      <span className="recommendation-icon">✏️</span>
                                      <span>{recommendation.message}</span>
                                    </div>
                                    <div className="recommendation-details">
                                      {recommendation.details}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}

                          {/* Family Health History Recommendations */}
                          {signupForm.familyHealthIssues?.map(issueId => {
                            // Skip if this condition is already recommended from personal health history
                            if (signupForm.healthIssues.includes(issueId)) {
                              return null;
                            }

                            const recommendation = healthConditionRecommendations[issueId];
                            if (recommendation) {
                              return (
                                <div key={`family-${issueId}`} className="recommendation-item">
                                  <div className="recommendation-header">
                                    <span className="recommendation-icon">👨‍👩‍👧‍👦</span>
                                    <h5 className="recommendation-title">{recommendation.title} (Family History)</h5>
                                  </div>
                                  <div className="recommendation-content">
                                    <div className="recommendation-nutrients">
                                      <span className="recommendation-icon">🔹</span>
                                      <span>Suggested Micronutrients: </span>
                                      {recommendation.nutrients.map(nutrientId => {
                                        const nutrient = micronutrientOptions.find(n => n.id === nutrientId);
                                        return nutrient ? nutrient.label : '';
                                      }).join(", ")}
                                    </div>
                                    <div className="recommendation-message">
                                      <span className="recommendation-icon">✏️</span>
                                      <span>{recommendation.message}</span>
                                    </div>
                                    <div className="recommendation-details">
                                      {recommendation.details}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}

                      <Select 
                        value={signupForm.micronutrients[0] || ""}
                        onValueChange={(value) => {
                          const newNutrients = [value];
                          if (signupForm.micronutrients[1]) newNutrients.push(signupForm.micronutrients[1]);
                          if (signupForm.micronutrients[2]) newNutrients.push(signupForm.micronutrients[2]);
                          setSignupForm(prev => ({
                            ...prev,
                            micronutrients: newNutrients
                          }));
                        }}
                      >
                        <SelectTrigger className="select-trigger">
                          <SelectValue>
                            {signupForm.micronutrients[0] 
                              ? micronutrientOptions.find(n => n.id === signupForm.micronutrients[0])?.label 
                              : "Select first micronutrient"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="select-content">
                          {micronutrientOptions.map((nutrient) => (
                            <SelectItem className="select-item" key={nutrient.id} value={nutrient.id}>
                              {nutrient.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Second Micronutrient - Only show if first is selected */}
                      {signupForm.micronutrients[0] && (
                        <Select 
                          value={signupForm.micronutrients[1] || ""}
                          onValueChange={(value) => {
                            const newNutrients = [signupForm.micronutrients[0], value];
                            if (signupForm.micronutrients[2]) newNutrients.push(signupForm.micronutrients[2]);
                            setSignupForm(prev => ({
                              ...prev,
                              micronutrients: newNutrients
                            }));
                          }}
                        >
                          <SelectTrigger className="select-trigger">
                            <SelectValue>
                              {signupForm.micronutrients[1] 
                                ? micronutrientOptions.find(n => n.id === signupForm.micronutrients[1])?.label 
                                : "Select second micronutrient"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="select-content">
                            {micronutrientOptions
                              .filter(nutrient => !signupForm.micronutrients.includes(nutrient.id))
                              .map((nutrient) => (
                                <SelectItem className="select-item" key={nutrient.id} value={nutrient.id}>
                                  {nutrient.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* Third Micronutrient - Only show if second is selected */}
                      {signupForm.micronutrients[1] && (
                        <Select 
                          value={signupForm.micronutrients[2] || ""}
                          onValueChange={(value) => {
                            setSignupForm(prev => ({
                              ...prev,
                              micronutrients: [prev.micronutrients[0], prev.micronutrients[1], value]
                            }));
                          }}
                        >
                          <SelectTrigger className="select-trigger">
                            <SelectValue>
                              {signupForm.micronutrients[2] 
                                ? micronutrientOptions.find(n => n.id === signupForm.micronutrients[2])?.label 
                                : "Select third micronutrient"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="select-content">
                            {micronutrientOptions
                              .filter(nutrient => !signupForm.micronutrients.includes(nutrient.id))
                              .map((nutrient) => (
                                <SelectItem className="select-item" key={nutrient.id} value={nutrient.id}>
                                  {nutrient.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

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

                    {/* Meals Per Day */}
                    <div className="space-y-2">
                      <Label htmlFor="meals-per-day">Meals Per Day</Label>
                      <Select 
                        value={signupForm.mealsPerDay}
                        onValueChange={(value) => handleSelectChange(value, "mealsPerDay")}
                      >
                        <SelectTrigger className="select-trigger" id="meals-per-day">
                          <SelectValue>
                            {signupForm.mealsPerDay 
                              ? `${signupForm.mealsPerDay} ${signupForm.mealsPerDay === "1" ? "meal" : "meals"}`
                              : "Select number of meals"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="select-content">
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem className="select-item" key={num} value={num.toString()}>
                              {num} {num === 1 ? "meal" : "meals"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    
                    <div className="grid grid-cols-1 gap-1">
                      {healthGoalOptions.map((goal) => {
                        const isSelected = signupForm.healthGoals.includes(goal.id);
                        return (
                          <div 
                            key={goal.id}
                            className={`py-1 px-2 rounded-md ${isSelected ? 'bg-primary/10' : ''} transition-colors`}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`goal-${goal.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleHealthGoalChange(goal.id)}
                                disabled={signupForm.healthGoals.length >= 3 && !isSelected}
                                className="h-3 w-3"
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
                    <Button 
                      type="submit" 
                      className="w-full bg-[#D4E157] hover:bg-[#DCE775] text-black font-medium"
                      disabled={signupLoading}
                    >
                      {signupLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating account...
                        </div>
                      ) : (
                        'Create Account'
                      )}
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