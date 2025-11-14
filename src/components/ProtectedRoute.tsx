import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
interface ProtectedRouteProps {
  children: React.ReactElement;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // If user is authenticated but has no familyId, redirect to the family setup page
  if (user && !user.familyId) {
    // Allow access to the family setup page itself
    if (location.pathname === '/family-setup') {
      return children;
    }
    return <Navigate to="/family-setup" replace />;
  }
  // If user has a family, but is trying to access the setup page, redirect to home
  if (user && user.familyId && location.pathname === '/family-setup') {
    return <Navigate to="/" replace />;
  }
  return children;
}