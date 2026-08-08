import { Navigate, Outlet } from 'react-router-dom';

// Protected Route
// Restricts access to authenticated users based on token presence.
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
