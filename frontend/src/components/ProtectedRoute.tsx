import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

/**
 * Protected Route Component
 *
 * Skyddar routes som kräver autentisering och/eller specifika roller
 *
 * Exempel:
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredRoles={['ADMIN']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Visa ingenting medan vi laddar
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Laddar...</div>
      </div>
    );
  }

  // Inte inloggad - redirect till login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Om specifika roller krävs, kolla att användaren har en av dem
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Åtkomst nekad</h2>
        <p>Du har inte behörighet att visa denna sida.</p>
        <p>Din roll: {user.role}</p>
        <p>Krävs: {requiredRoles.join(' eller ')}</p>
      </div>
    );
  }

  // Autentiserad och har rätt roll
  return <>{children}</>;
};
