import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicRoute({ children }) {
  const { isAuthenticated, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return <main className="screen-message">Checking your session...</main>;
  }

  if (isAuthenticated) {
    return <Navigate to="/tasks" replace />;
  }

  return children;
}
