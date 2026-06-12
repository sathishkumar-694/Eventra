import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth';

function ProtectedRoute({ children, redirectTo = '/login' }) {
  if (!isLoggedIn()) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

export default ProtectedRoute;
