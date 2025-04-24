import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyProfile.css";
import Navbar from "../components/ui/Navbar";
import { Button } from "../components/ui/button-ui";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { 
  healthIssueOptions, 
  dietaryOptions, 
  micronutrientOptions, 
  healthGoalOptions,
  activityLevelOptions,
  foodsToAvoidOptions,
  healthConditionRecommendations
} from "../data/profileOptions";
import { API_BASE_URL } from '../config';

const Profile = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    profile: {
      date_of_birth: "",
      sex: "",
      height: { value: 0, unit: "cm" },
      weight: { value: 0, unit: "kg" },
      activity_level: "",
      personal_health_history: [],
      family_health_history: [],
      priority_micronutrients: [],
      dietary_preferences: [],
      meals_per_day: "",
      foods_to_avoid: [],
      health_goals: []
    }
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found");
        navigate("/signup");
        return;
      }

      // Remove Bearer prefix if it exists
      const cleanToken = token.replace('Bearer ', '');

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setFormData(data);
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/signup");
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      localStorage.removeItem("token");
      navigate("/signup");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [parent]: {
            ...prev.profile[parent],
            [child]: value
          }
        }
      }));
    } else if (name.startsWith("profile_")) {
      const profileField = name.replace("profile_", "");
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (id, field) => {
    setFormData(prev => {
      const currentValues = prev.profile[field] || [];
      if (currentValues.includes(id)) {
        return {
          ...prev,
          profile: {
            ...prev.profile,
            [field]: currentValues.filter(item => item !== id)
          }
        };
      } else if (currentValues.length < 3) {
        return {
          ...prev,
          profile: {
            ...prev.profile,
            [field]: [...currentValues, id]
          }
        };
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Remove Bearer prefix if it exists
      const cleanToken = token.replace('Bearer ', '');

      // Check if any major health-related fields have changed
      const majorChanges = [
        'profile.weight.value',
        'profile.height.value',
        'profile.date_of_birth',
        'profile.activity_level',
        'profile.personal_health_history',
        'profile.family_health_history',
        'profile.health_goals'
      ];

      const hasMajorChanges = majorChanges.some(field => {
        const [parent, child] = field.split('.');
        if (child) {
          // Special handling for date_of_birth
          if (field === 'profile.date_of_birth') {
            const newDate = formData.profile.date_of_birth;
            const oldDate = userProfile.profile.date_of_birth;
            return newDate !== oldDate;
          }
          return JSON.stringify(formData[parent][child]) !== JSON.stringify(userProfile[parent][child]);
        }
        return JSON.stringify(formData[parent]) !== JSON.stringify(userProfile[parent]);
      });

      let nutritionalNeeds = null;
      if (hasMajorChanges) {
        // If there are major changes, call the GPT analysis endpoint first
        console.log('Major health changes detected, calling GPT analysis endpoint');
        setIsAnalyzing(true);
        
        try {
          const gptResponse = await fetch(`${API_BASE_URL}/api/nutrition/analyze-profile`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cleanToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_profile: formData,
              previous_profile: userProfile
            })
          });

          if (!gptResponse.ok) {
            const errorData = await gptResponse.json();
            throw new Error(errorData.detail || 'Failed to analyze profile changes');
          }

          const gptAnalysis = await gptResponse.json();
          console.log('GPT analysis received:', gptAnalysis);
          nutritionalNeeds = gptAnalysis.nutritional_needs;
        } catch (error) {
          console.error('Error during GPT analysis:', error);
          throw error;
        } finally {
          setIsAnalyzing(false);
        }
      }

      // Update the profile with the new data
      console.log('Updating profile with data:', formData);
      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          ...(nutritionalNeeds && { nutritional_needs: nutritionalNeeds })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      console.log('Profile updated successfully:', updatedUser);
      setUserProfile(updatedUser);
      setFormData(updatedUser);
      setSuccessMessage('Profile updated successfully!' + (hasMajorChanges ? ' Your nutritional needs have been recalculated.' : ''));
      setEditMode(false); // Exit edit mode
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error stack:', error.stack);
      setError(error.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Helper function to get label from ID
  const getLabelFromId = (id, options) => {
    const option = options.find(opt => opt.id === id);
    return option ? option.label : id;
  };

  if (loading) {
    return (
      <div className="profile-container">
        <Navbar />
        <div className="profile-content">
          <Card className="profile-card">
            <div>Loading profile...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="profile-container">
        <Navbar />
        <div className="profile-content">
          <Card className="profile-card">
            <div>No profile data available. Please try logging in again.</div>
            <Button onClick={() => navigate("/signup")}>Go to Login</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Navbar />
      <div className="profile-content">
        <Card className="profile-card">
          <h1 className="profile-title">My Profile</h1>
          
          {!editMode ? (
            <div className="profile-info">
              {/* Step 1: Basic Information */}
              <div className="profile-info-section">
                <h2>Basic Information</h2>
                <p><strong>Name:</strong> <span className="value">{userProfile?.first_name || 'N/A'}</span></p>
                <p><strong>Email:</strong> <span className="value">{userProfile?.email || 'N/A'}</span></p>
                <p><strong>Date of Birth:</strong> <span className="value">{userProfile?.profile?.date_of_birth || 'N/A'}</span></p>
                <p><strong>Sex:</strong> <span className="value">{userProfile?.profile?.sex || 'N/A'}</span></p>
              </div>

              {/* Step 2: Physical Information */}
              <div className="profile-info-section">
                <h2>Physical Information</h2>
                <p><strong>Height:</strong> <span className="value">{userProfile?.profile?.height.value || 0} cm</span></p>
                <p><strong>Weight:</strong> <span className="value">{userProfile?.profile?.weight.value || 0} kg</span></p>
                <p><strong>Activity Level:</strong> <span className="value">{getLabelFromId(userProfile?.profile?.activity_level, activityLevelOptions) || 'N/A'}</span></p>
              </div>

              {/* Step 3: Health Information */}
              <div className="profile-info-section">
                <h2>Health Information</h2>
                <p><strong>Health Conditions:</strong> <span className="value">{userProfile?.profile?.personal_health_history.map(id => getLabelFromId(id, healthIssueOptions)).join(", ") || 'N/A'}</span></p>
                <p><strong>Family Health History:</strong> <span className="value">{userProfile?.profile?.family_health_history.map(id => getLabelFromId(id, healthIssueOptions)).join(", ") || 'N/A'}</span></p>
                <p><strong>Priority Nutrients:</strong> <span className="value">{userProfile?.profile?.priority_micronutrients.map(id => getLabelFromId(id, micronutrientOptions)).join(", ") || 'N/A'}</span></p>
              </div>

              {/* Step 4: Dietary Preferences */}
              <div className="profile-info-section">
                <h2>Dietary Preferences</h2>
                <p><strong>Diet Type:</strong> <span className="value">{userProfile?.profile?.dietary_preferences.join(", ") || 'N/A'}</span></p>
                <p><strong>Meals per Day:</strong> <span className="value">{userProfile?.profile?.meals_per_day || 'N/A'}</span></p>
                <p><strong>Foods to Avoid:</strong> <span className="value">{userProfile?.profile?.foods_to_avoid.map(id => getLabelFromId(id, foodsToAvoidOptions)).join(", ") || 'N/A'}</span></p>
                <p><strong>Health Goals:</strong> <span className="value">{userProfile?.profile?.health_goals.map(id => getLabelFromId(id, healthGoalOptions)).join(", ") || 'N/A'}</span></p>
              </div>

              <div className="profile-actions">
                <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
                <Button variant="destructive" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          ) : (
            <div className="profile-edit">
              {/* Step navigation - Only visible in edit mode */}
              <div className="step-navigation">
                {[1, 2, 3, 4].map((step) => (
                  <Button
                    key={step}
                    variant={currentStep === step ? "default" : "outline"}
                    onClick={() => setCurrentStep(step)}
                    data-state={currentStep === step ? "active" : ""}
                  >
                    Step {step}
                  </Button>
                ))}
              </div>

              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="edit-section">
                  <h2>Basic Information</h2>
                  <div className="form-group">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.profile.date_of_birth}
                      onChange={(e) => handleInputChange("profile_date_of_birth", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="sex">Sex</Label>
                    <Select
                      value={formData.profile.sex}
                      onValueChange={(value) => handleInputChange("profile_sex", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Physical Information */}
              {currentStep === 2 && (
                <div className="edit-section">
                  <h2>Physical Information</h2>
                  <div className="form-group">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.profile.height.value}
                      onChange={(e) => handleInputChange("profile.height.value", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.profile.weight.value}
                      onChange={(e) => handleInputChange("profile.weight.value", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="activity_level">Activity Level</Label>
                    <Select
                      value={formData.profile.activity_level}
                      onValueChange={(value) => handleInputChange("profile_activity_level", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityLevelOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Health Information */}
              {currentStep === 3 && (
                <div className="edit-section">
                  <h2>Health Information</h2>
                  <div className="form-group">
                    <Label>Health Conditions (Select up to 3)</Label>
                    <div className="health-history-grid">
                      {healthIssueOptions.map((option) => (
                        <div key={option.id} className="health-history-item">
                          <Checkbox
                            checked={formData.profile.personal_health_history.includes(option.id)}
                            onCheckedChange={() => handleCheckboxChange(option.id, "personal_health_history")}
                            disabled={
                              formData.profile.personal_health_history.length >= 3 &&
                              !formData.profile.personal_health_history.includes(option.id)
                            }
                          />
                          <Label>{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <Label>Family Health History (Select up to 3)</Label>
                    <div className="health-history-grid">
                      {healthIssueOptions.map((option) => (
                        <div key={option.id} className="health-history-item">
                          <Checkbox
                            checked={formData.profile.family_health_history.includes(option.id)}
                            onCheckedChange={() => handleCheckboxChange(option.id, "family_health_history")}
                            disabled={
                              formData.profile.family_health_history.length >= 3 &&
                              !formData.profile.family_health_history.includes(option.id)
                            }
                          />
                          <Label>{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Recommendations */}
                  {(formData.profile.personal_health_history.length > 0 || formData.profile.family_health_history.length > 0) && (
                    <div className="recommendations-box mb-4">
                      <h4 className="text-sm font-medium mb-2">Smart Recommendations</h4>
                      {formData.profile.personal_health_history.map(issueId => {
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
                    </div>
                  )}

                  <div className="form-group">
                    <Label>Priority Micronutrients to Track</Label>
                    <p className="text-xs text-muted-foreground mb-2">Select up to 3 micronutrients to track based on your health conditions</p>
                    <Select 
                      value={formData.profile.priority_micronutrients[0] || ""}
                      onValueChange={(value) => {
                        const newNutrients = [value];
                        if (formData.profile.priority_micronutrients[1]) newNutrients.push(formData.profile.priority_micronutrients[1]);
                        if (formData.profile.priority_micronutrients[2]) newNutrients.push(formData.profile.priority_micronutrients[2]);
                        handleInputChange("profile_priority_micronutrients", newNutrients);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formData.profile.priority_micronutrients[0] 
                            ? micronutrientOptions.find(n => n.id === formData.profile.priority_micronutrients[0])?.label 
                            : "Select first micronutrient"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {micronutrientOptions.map((nutrient) => (
                          <SelectItem key={nutrient.id} value={nutrient.id}>
                            {nutrient.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formData.profile.priority_micronutrients[0] && (
                      <Select 
                        value={formData.profile.priority_micronutrients[1] || ""}
                        onValueChange={(value) => {
                          const newNutrients = [formData.profile.priority_micronutrients[0], value];
                          if (formData.profile.priority_micronutrients[2]) newNutrients.push(formData.profile.priority_micronutrients[2]);
                          handleInputChange("profile_priority_micronutrients", newNutrients);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {formData.profile.priority_micronutrients[1] 
                              ? micronutrientOptions.find(n => n.id === formData.profile.priority_micronutrients[1])?.label 
                              : "Select second micronutrient"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {micronutrientOptions
                            .filter(nutrient => !formData.profile.priority_micronutrients.includes(nutrient.id))
                            .map((nutrient) => (
                              <SelectItem key={nutrient.id} value={nutrient.id}>
                                {nutrient.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}

                    {formData.profile.priority_micronutrients[1] && (
                      <Select 
                        value={formData.profile.priority_micronutrients[2] || ""}
                        onValueChange={(value) => {
                          handleInputChange("profile_priority_micronutrients", [
                            formData.profile.priority_micronutrients[0],
                            formData.profile.priority_micronutrients[1],
                            value
                          ]);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {formData.profile.priority_micronutrients[2] 
                              ? micronutrientOptions.find(n => n.id === formData.profile.priority_micronutrients[2])?.label 
                              : "Select third micronutrient"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {micronutrientOptions
                            .filter(nutrient => !formData.profile.priority_micronutrients.includes(nutrient.id))
                            .map((nutrient) => (
                              <SelectItem key={nutrient.id} value={nutrient.id}>
                                {nutrient.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Dietary Preferences */}
              {currentStep === 4 && (
                <div className="edit-section">
                  <h2>Dietary Preferences</h2>
                  <div className="form-group">
                    <Label>Diet Type (Select up to 2)</Label>
                    <div className="grid">
                      {dietaryOptions.map((option) => (
                        <div 
                          key={option} 
                          className={`filter-button ${formData.profile.dietary_preferences.includes(option) ? 'selected' : ''}`}
                          onClick={() => {
                            const newPreferences = [...formData.profile.dietary_preferences];
                            if (newPreferences.includes(option)) {
                              handleInputChange("profile_dietary_preferences", newPreferences.filter(pref => pref !== option));
                            } else if (newPreferences.length < 2) {
                              handleInputChange("profile_dietary_preferences", [...newPreferences, option]);
                            }
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <Label>Meals per Day</Label>
                    <Select 
                      value={formData.profile.meals_per_day}
                      onValueChange={(value) => handleInputChange("profile_meals_per_day", value)}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formData.profile.meals_per_day 
                            ? `${formData.profile.meals_per_day} ${formData.profile.meals_per_day === "1" ? "meal" : "meals"}`
                            : "Select number of meals"}
                        </SelectValue>
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

                  <div className="form-group">
                    <Label>Foods to Avoid</Label>
                    <div className="grid">
                      {foodsToAvoidOptions.map((option) => (
                        <div 
                          key={option.id} 
                          className={`filter-button ${formData.profile.foods_to_avoid.includes(option.id) ? 'selected' : ''}`}
                          onClick={() => {
                            const newFoods = [...formData.profile.foods_to_avoid];
                            if (newFoods.includes(option.id)) {
                              handleInputChange("profile_foods_to_avoid", newFoods.filter(food => food !== option.id));
                            } else {
                              handleInputChange("profile_foods_to_avoid", [...newFoods, option.id]);
                            }
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <Label>Health Goals (Select up to 3)</Label>
                    <div className="grid grid-cols-1 gap-1">
                      {healthGoalOptions.map((goal) => {
                        const isSelected = formData.profile.health_goals.includes(goal.id);
                        return (
                          <div 
                            key={goal.id}
                            className={`py-1 px-2 rounded-md ${isSelected ? 'bg-primary/10' : ''} transition-colors`}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`goal-${goal.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleCheckboxChange(goal.id, "health_goals")}
                                disabled={formData.profile.health_goals.length >= 3 && !isSelected}
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
                </div>
              )}

              <div className="profile-actions">
                <Button 
                  onClick={handleSubmit}
                  disabled={isAnalyzing}
                  className={isAnalyzing ? 'analyzing' : ''}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing Health Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile; 