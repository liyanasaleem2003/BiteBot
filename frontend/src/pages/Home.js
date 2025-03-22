import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./Home.css";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/ui/Footer";

function Home() {
  const navigate = useNavigate(); // Initialize navigation function

  return (
    <div className="home-container">
      <Navbar />

      {/* Center Content */}
      <div className="center-content">
        <h1>Your Personalised <br /> South Asian Guide</h1>
        <div className="subtext">
          Eat Smart & Stay Rooted with BiteBot —
          Track your meals, discover balanced recipes, and embrace wellness — Your journey starts here!
        </div>
      </div>

      {/* Feature Buttons */}
      <div className="feature-buttons">
        <div className="button-card top-left" onClick={() => navigate("/log-meal")}>
          <h2>Log My Meal</h2>
          <p>Upload an image of your food and let our AI analyze its nutritional composition.</p>
        </div>
        <div className="button-card top-right" onClick={() => navigate("/dashboard")}>
          <h2>My Dashboard</h2>
          <p>Monitor nutrients, track progress, view past meals, and access saved recipes.</p>
        </div>
        <div className="button-card bottom-left" onClick={() => navigate("/eatwell-guide")}>
          <h2>EatWell Guide</h2>
          <p>Learn balanced eating habits rooted in South Asian culture and wellness principles.</p>
        </div>
        <div className="button-card bottom-right" onClick={() => navigate("/recipes")}>
          <h2>Browse Recipes</h2>
          <p>Find South Asian recipes tailored to your health goals, preferences, and dietary needs.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Home;
