import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUser } from '../utils/auth';

function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }) {
  if (!isLoggedIn()) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles) {
    const user = getUser();
    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
