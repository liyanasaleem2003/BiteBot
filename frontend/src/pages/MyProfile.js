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
import { healthIssueOptions, dietaryOptions, micronutrientOptions, healthGoalOptions } from "../data/profileOptions";

const Profile = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);

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
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setFormData(data);
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Profile updated successfully!");
        setEditMode(false);
        fetchUserProfile();
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <Navbar />
      <div className="profile-content">
        <Card className="profile-card">
          <h1 className="profile-title">My Profile</h1>
          
          {!editMode ? (
            <div className="profile-info">
              <h2>Personal Information</h2>
              <p><strong>Name:</strong> {userProfile.first_name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Date of Birth:</strong> {userProfile.profile.date_of_birth}</p>
              <p><strong>Sex:</strong> {userProfile.profile.sex}</p>
              <p><strong>Height:</strong> {userProfile.profile.height.value} cm</p>
              <p><strong>Weight:</strong> {userProfile.profile.weight.value} kg</p>
              <p><strong>Activity Level:</strong> {userProfile.profile.activity_level}</p>
              
              <h2>Health Information</h2>
              <p><strong>Health Conditions:</strong> {userProfile.profile.personal_health_history.join(", ")}</p>
              <p><strong>Family Health History:</strong> {userProfile.profile.family_health_history.join(", ")}</p>
              <p><strong>Priority Nutrients:</strong> {userProfile.profile.priority_micronutrients.join(", ")}</p>
              
              <h2>Dietary Preferences</h2>
              <p><strong>Diet Type:</strong> {userProfile.profile.dietary_preferences.join(", ")}</p>
              <p><strong>Meals per Day:</strong> {userProfile.profile.meals_per_day}</p>
              <p><strong>Foods to Avoid:</strong> {userProfile.profile.foods_to_avoid.join(", ")}</p>
              <p><strong>Health Goals:</strong> {userProfile.profile.health_goals.join(", ")}</p>

              <div className="profile-actions">
                <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
                <Button variant="destructive" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          ) : (
            <div className="profile-edit">
              {/* Step navigation */}
              <div className="step-navigation">
                {[1, 2, 3, 4].map((step) => (
                  <Button
                    key={step}
                    variant={currentStep === step ? "default" : "outline"}
                    onClick={() => setCurrentStep(step)}
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
                </div>
              )}

              {/* Step 2: Physical Information */}
              {currentStep === 2 && (
                <div className="edit-section">
                  <h2>Physical Information</h2>
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
                  {/* Add other physical information fields */}
                </div>
              )}

              {/* Step 3: Health Information */}
              {currentStep === 3 && (
                <div className="edit-section">
                  <h2>Health Information</h2>
                  <div className="form-group">
                    <Label>Health Conditions (Select up to 3)</Label>
                    {healthIssueOptions.map((option) => (
                      <div key={option.id} className="checkbox-item">
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
              )}

              {/* Step 4: Dietary Preferences */}
              {currentStep === 4 && (
                <div className="edit-section">
                  <h2>Dietary Preferences</h2>
                  <div className="form-group">
                    <Label>Diet Type (Select up to 2)</Label>
                    {dietaryOptions.map((option) => (
                      <div key={option} className="checkbox-item">
                        <Checkbox
                          checked={formData.profile.dietary_preferences.includes(option)}
                          onCheckedChange={() => handleCheckboxChange(option, "dietary_preferences")}
                          disabled={
                            formData.profile.dietary_preferences.length >= 2 &&
                            !formData.profile.dietary_preferences.includes(option)
                          }
                        />
                        <Label>{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-actions">
                <Button onClick={handleSubmit}>Save Changes</Button>
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