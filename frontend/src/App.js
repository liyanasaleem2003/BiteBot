import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Recipes from "./pages/Recipes";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/MyProfile";
import PrivateRoute from "./components/PrivateRoute";
import { FavoriteRecipesProvider } from "./context/FavoriteRecipesContext";

function App() {
  return (
    <FavoriteRecipesProvider>
      <Router>
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
        </Routes>
      </Router>
    </FavoriteRecipesProvider>
  );
}

export default App;
