import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock, BarChart2, BookOpen, Utensils, Settings, Home } from "lucide-react";
import "./Navbar.css";
import logo from "../../images/BiteBotLogolonger.png";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <Link to="/home" className="logo-link">
        <img src={logo} alt="BiteBot" className="logo" />
      </Link>
      <ul className="nav-links">
        <li>
          <Link to="/home" className={isActive("/home") ? "active" : ""}>
            <Home className="icon" />
            <span>Home</span>
          </Link>
        </li>
        <li>
          <Link to="/log-your-meal" className={isActive("/log-your-meal") ? "active" : ""}>
            <Clock className="icon" />
            <span>Log My Meal</span>
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
            <BarChart2 className="icon" />
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/eatwell-guide" className={isActive("/eatwell-guide") ? "active" : ""}>
            <BookOpen className="icon" />
            <span>EatWell Guide</span>
          </Link>
        </li>
        <li>
          <Link to="/recipes" className={isActive("/recipes") ? "active" : ""}>
            <Utensils className="icon" />
            <span>Browse Recipes</span>
          </Link>
        </li>
        <li>
          <Link to="/settings" className={isActive("/settings") ? "active" : ""}>
            <Settings className="icon" />
            <span>Settings</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
