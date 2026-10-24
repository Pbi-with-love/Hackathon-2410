import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import TopNav from './components/TopNav';
import MatchNotifications from './components/MatchNotifications';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import MatchPage from './pages/MatchPage';
import TeamMatchingMapPage from './pages/TeamMatchingMapPage';
import MentorDiscoveryMapPage from './pages/MentorDiscoveryMapPage';
import ProfilePage from './pages/ProfilePage';
import TeamPage from './pages/TeamPage';
import MatchesPage from './pages/MatchesPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Desktop shell: TopNav + full-height content */
function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <TopNav />
      <main style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

/** Full-height shell for map pages (no main scroll, map fills space) */
function MapShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <TopNav />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<DesktopShell><LandingPage /></DesktopShell>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main pages (require login — backend endpoints need auth) */}
      <Route path="/match" element={<DesktopShell><MatchPage /></DesktopShell>} />
      <Route
        path="/map/teams"
        element={
          <PrivateRoute>
            <MapShell>
              <TeamMatchingMapPage />
            </MapShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/map/mentors"
        element={
          <PrivateRoute>
            <MapShell>
              <MentorDiscoveryMapPage />
            </MapShell>
          </PrivateRoute>
        }
      />

      {/* Secondary (behind avatar menu) */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <DesktopShell><ProfilePage /></DesktopShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/team/:id"
        element={
          <PrivateRoute>
            <DesktopShell><TeamPage /></DesktopShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <PrivateRoute>
            <DesktopShell><MatchesPage /></DesktopShell>
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <MatchNotifications />
    </AuthProvider>
  );
}
