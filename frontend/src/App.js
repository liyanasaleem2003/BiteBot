import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Recipes from "./pages/Recipes";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/MyProfile";
import LogMyMeal from "./pages/LogMyMeal";
import EatWellGuide from "./pages/EatWellGuide";
import PrivateRoute from "./components/PrivateRoute";
import { FavoriteRecipesProvider } from "./context/FavoriteRecipesContext";
import { ShoppingListProvider } from './context/ShoppingListContext';
import Navbar from './components/ui/Navbar';

// Wrapper component to handle navbar visibility
function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/signup';

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <Routes>
        {/* Route Definitions */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/myprofile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/recipes" 
          element={
            <PrivateRoute>
              <Recipes />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/log-my-meal" 
          element={
            <PrivateRoute>
              <LogMyMeal />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/eatwell-guide" 
          element={
            <PrivateRoute>
              <EatWellGuide />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <FavoriteRecipesProvider>
        <ShoppingListProvider>
          <AppContent />
        </ShoppingListProvider>
      </FavoriteRecipesProvider>
    </Router>
  );
}

export default App;
