import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
interface ProtectedRouteProps {
  children: React.ReactElement;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const family = useAuthStore((s) => s.family);
  const user = useAuthStore((s) => s.user);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // If user is authenticated but has no familyId, redirect to the family gate page
  if (user && !user.familyId) {
    return <Navigate to="/family-gate" replace />;
  }
  // If user has a familyId but the family object isn't loaded yet (can happen on first load),
  // we might want to show a loading state or let it pass, assuming it will load.
  // For now, we'll let it pass if familyId exists.
  if (user && user.familyId && !family) {
     // This case can happen right after joining a family before the state is fully updated.
     // The FamilyGatePage should handle the redirect back once the family is set.
     // Or we can assume the user object is the source of truth for having a family.
  }
  return children;
}