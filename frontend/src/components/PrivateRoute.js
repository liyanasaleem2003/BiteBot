import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to signup if there's no token
    return <Navigate to="/signup" replace />;
  }

  return children;
};

export default PrivateRoute; 