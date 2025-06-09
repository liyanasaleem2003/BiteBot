import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock, BarChart2, BookOpen, Utensils, Settings, Home, X } from "lucide-react";
import "./Navbar.css";
import logo from "../../images/BiteBotLogolonger.png";
import ShoppingList from "./ShoppingList";

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close menu on navigation (mobile)
  const handleNavClick = () => setMenuOpen(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <Link to="/home" className="logo-link">
        <img src={logo} alt="BiteBot" className="logo" />
      </Link>
      {/* Hamburger icon for mobile */}
      <button 
        className={`hamburger ${menuOpen ? 'open' : ''}`} 
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {/* Overlay for mobile menu */}
      <div className={`menu-overlay ${menuOpen ? 'show' : ''}`} onClick={handleNavClick}></div>
      <ul className={`nav-links ${menuOpen ? 'show' : ''}`}>
        <button className="close-menu" onClick={handleNavClick} aria-label="Close menu">
          <X size={24} />
        </button>
        <li>
          <Link to="/home" className={isActive("/home") ? "active" : ""} onClick={handleNavClick}>
            <Home className="icon" />
            <span>Home</span>
          </Link>
        </li>
        <li>
          <Link to="/log-my-meal" className={isActive("/log-my-meal") ? "active" : ""} onClick={handleNavClick}>
            <Clock className="icon" />
            <span>Log My Meal</span>
          </Link>
        </li>
        <li>
          <Link to="/recipes" className={isActive("/recipes") ? "active" : ""} onClick={handleNavClick}>
            <Utensils className="icon" />
            <span>Browse Recipes</span>
          </Link>
        </li>
        <li>
          <Link to="/eatwell-guide" className={isActive("/eatwell-guide") ? "active" : ""} onClick={handleNavClick}>
            <BookOpen className="icon" />
            <span>EatWell Guide</span>
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""} onClick={handleNavClick}>
            <BarChart2 className="icon" />
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/myprofile" className={isActive("/myprofile") ? "active" : ""} onClick={handleNavClick}>
            <Settings className="icon" />
            <span>My Profile</span>
          </Link>
        </li>
        <li>
          <ShoppingList />
        </li>
      </ul>
    </nav>
  );
}
