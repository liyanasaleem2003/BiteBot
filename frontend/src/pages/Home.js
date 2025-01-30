import React from "react";
import { Link } from "react-router-dom"; // For routing
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">BiteBot</div>
        <ul className="nav-links">
          <li><Link to="/log-your-meal">Log My Meal</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/eatwell-guide">EatWell Guide</Link></li>
          <li><Link to="/browse-recipes">Browse Recipes</Link></li>
          <li><Link to="/settings">Settings</Link></li>
        </ul>
      </nav>

      {/* Center Content */}
      <div className="center-content">
        <h1>Your Personalised <br /> South Asian Guide</h1>
        <div className="subtext">
          Eat Smart & Stay Rooted with BiteBot —
          Track your meals, discover balanced recipes, and embrace wellness — Your journey starts here!
        </div>
      </div>

   <div className="feature-buttons">
  <div className="button-card top-left">
    <h2>Log My Meal</h2>
    <p>Upload an image of your food and let our AI analyze its nutritional composition.</p>
  </div>
  <div className="button-card top-right">
    <h2>My Dashboard</h2>
    <p>Monitor nutrients, track progress, view past meals, and access saved recipes.</p>
  </div>
  <div className="button-card bottom-left">
    <h2>EatWell Guide</h2>
    <p>Learn balanced eating habits rooted in South Asian culture and wellness principles.</p>
  </div>
  <div className="button-card bottom-right">
    <h2>Browse Recipes</h2>
    <p>Find South Asian recipes tailored to your health goals, preferences, and dietary needs.</p>
  </div>
</div>


      {/* Footer */}
      <footer className="footer">
        <p>© 2023 BiteBot. All rights reserved.</p>
        <a href="/">Privacy Policy</a> | <a href="/">Terms of Service</a>
      </footer>
    </div>
  );
}

export default Home;
