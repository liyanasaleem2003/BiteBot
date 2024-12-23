import React, { useState } from "react";
import axios from "axios";

function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    age: "",
    bmi: "",
    height: "",
    familyHistory: "",
    dietaryPreferences: "",
    goals: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/auth/signup", {
        ...formData,
        family_history: formData.familyHistory.split(","),
        dietary_preferences: formData.dietaryPreferences.split(","),
        goals: formData.goals.split(","),
      });
      alert(response.data.message);
    } catch (err) {
      alert(err.response.data.detail);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="bmi"
          placeholder="BMI"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="height"
          placeholder="Height"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="familyHistory"
          placeholder="Family History (comma-separated)"
          onChange={handleChange}
        />
        <input
          type="text"
          name="dietaryPreferences"
          placeholder="Dietary Preferences (comma-separated)"
          onChange={handleChange}
        />
        <input
          type="text"
          name="goals"
          placeholder="Goals (comma-separated)"
          onChange={handleChange}
        />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default Signup;
