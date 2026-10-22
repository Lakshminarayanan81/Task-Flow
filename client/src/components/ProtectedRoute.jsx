import { Navigate } from 'react-router-dom';
// CHANGE [design]: import path only — WAS '../context/AuthContext'. useAuth moved to its own
// file (see context/useAuth.js for why). The logic below is unchanged.
import { useAuth } from '../context/useAuth';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
