import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { InviteComplete } from './pages/InviteComplete';
import { Dashboard } from './pages/Dashboard';
import { MeetingsList } from './pages/MeetingsList';
import { MeetingDetail } from './pages/MeetingDetail';
import { NewMeeting } from './pages/NewMeeting';
import { Users } from './pages/Users';

/**
 * Main App Component
 * Telink Mötesstatistik Dashboard
 *
 * Routing structure:
 * - /login - Login-sida
 * - /invite/complete - Slutför invite och skapa konto
 * - / - Dashboard (statistik) - Protected
 * - /users - Hantera personer/användare - Protected (ADMIN only)
 * - /meetings - Lista alla möten - Protected
 * - /meetings/new - Skapa nytt möte - Protected
 * - /meetings/:id - Detaljvy för möte - Protected
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/invite/complete" element={<InviteComplete />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <MeetingsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meetings/new"
            element={
              <ProtectedRoute>
                <NewMeeting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meetings/:id"
            element={
              <ProtectedRoute>
                <MeetingDetail />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect till dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
