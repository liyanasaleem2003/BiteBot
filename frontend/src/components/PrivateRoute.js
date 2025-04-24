import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to signup if there's no token
    return <Navigate to="/signup" replace />;
  }

  // Remove Bearer prefix if it exists and check if token is valid JWT format
  const cleanToken = token.replace('Bearer ', '');
  try {
    const tokenParts = cleanToken.split('.');
    if (tokenParts.length !== 3) {
      // Token is not in valid JWT format
      localStorage.removeItem('token');
      return <Navigate to="/signup" replace />;
    }
    
    // Check if token is expired
    const payload = JSON.parse(atob(tokenParts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Token is expired
      localStorage.removeItem('token');
      return <Navigate to="/signup" replace />;
    }
  } catch (e) {
    // Error parsing token
    console.error('Error parsing token:', e);
    localStorage.removeItem('token');
    return <Navigate to="/signup" replace />;
  }

  return children;
};

export default PrivateRoute; 