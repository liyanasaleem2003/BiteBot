import React, { useState } from "react";
import "./Signup.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import homeBackground from "../images/home_background.jpg";

const Signup = () => {
  const [currentView, setCurrentView] = useState("welcome"); // Track current view
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({
    age: "",
    sex: "",
    height: { feet: "", inches: "" },
    weight: "",
    activityLevel: "",
    healthGoal: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleHeightChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      height: { ...profileData.height, [name]: value },
    });
  };
  

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
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
          first_name: formData.firstName,
          email: formData.email,
          password: formData.password,
          profile: profileData, // Include profile data
        }),
      });
  
      if (response.ok) {
        alert("Signup Successful!");
        setCurrentView("profile"); // Move to profile questions
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };
  

  const handleBackToWelcome = () => {
    setCurrentView("welcome");
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
            plans and wellness advice that respect your heritage.
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
            onClick={() => setCurrentView("login")}
          >
            Already have an account? <span>Log In</span>
          </p>
        </div>
      )}

      {/* Right Section for Forms */}
      <div
        className="form-section"
        style={{
          transform:
            currentView === "signup"
              ? "translateX(100%)"
              : currentView === "profile"
              ? "translateX(100%)"
              : currentView === "login"
              ? "translateX(100%)"
              : "translateX(0)",
          transition: "transform 1s ease-in-out",
          paddingLeft: "20px",
        }}
      >

        {currentView === "signup" && (
          <div className="signup-box">
            <h2>Create Your Account</h2>
            <input
              type="text"
              name="firstName"
              placeholder="First Name *"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button onClick={handleSubmit}>Create Account</button>
            <p
              className="back-link"
              onClick={handleBackToWelcome}
            >
              Back to Welcome
            </p>
          </div>
        )}

        {currentView === "login" && (
          <div className="signup-box">
            <h2>Log In</h2>
            <input type="email" name="email" placeholder="Email *" required />
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password *"
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button>Log In</button>
            <p
              className="back-link"
              onClick={handleBackToWelcome}
            >
              Back to Welcome
            </p>
          </div>
        )}

        {currentView === "profile" && (
          <div className="profile-box">
            <h2>Complete Your Profile</h2>
            <input
              type="number"
              name="age"
              placeholder="How old are you?"
              value={profileData.age}
              onChange={handleProfileChange}
              required
            />
            <select
              name="sex"
              value={profileData.sex}
              onChange={handleProfileChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="preferNotToSay">Prefer Not to Say</option>
            </select>
            <div className="height-container">
              <input
                type="number"
                name="feet"
                placeholder="Feet"
                value={profileData.height.feet}
                onChange={handleHeightChange}
                required
              />
              <input
                type="number"
                name="inches"
                placeholder="Inches"
                value={profileData.height.inches}
                onChange={handleHeightChange}
                required
              />
            </div>
            <input
              type="number"
              name="weight"
              placeholder="Weight (kg)"
              value={profileData.weight}
              onChange={handleProfileChange}
              required
            />
            <select
              name="activityLevel"
              value={profileData.activityLevel}
              onChange={handleProfileChange}
              required
            >
              <option value="">Select Activity Level</option>
              <option value="sedentary">Sedentary</option>
              <option value="lightlyActive">Lightly Active</option>
              <option value="moderatelyActive">Moderately Active</option>
              <option value="highlyActive">Highly Active</option>
            </select>
            <select
              name="healthGoal"
              value={profileData.healthGoal}
              onChange={handleProfileChange}
              required
            >
              <option value="">Select Health Goal</option>
              <option value="maintain">Maintain Weight</option>
              <option value="lose">Lose Weight</option>
              <option value="gain">Gain Weight</option>
            </select>
            <button
              onClick={() => alert("Profile Completed!")}
            >
              Save Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;