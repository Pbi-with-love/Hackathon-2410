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
import MyTeamPage from './pages/MyTeamPage';
import TeamPage from './pages/TeamPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Desktop shell: TopNav + full-height content */
function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ground)' }}>
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
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ground)' }}>
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

      {/* Main pages */}
      <Route path="/match" element={<PrivateRoute><DesktopShell><MatchPage /></DesktopShell></PrivateRoute>} />
      <Route
        path="/map/teams"
        element={<PrivateRoute><MapShell><TeamMatchingMapPage /></MapShell></PrivateRoute>}
      />
      <Route
        path="/map/mentors"
        element={<PrivateRoute><MapShell><MentorDiscoveryMapPage /></MapShell></PrivateRoute>}
      />

      {/* My Team — replaces old /matches and /team/:id for viewing */}
      <Route
        path="/team"
        element={<PrivateRoute><DesktopShell><MyTeamPage /></DesktopShell></PrivateRoute>}
      />

      {/* Create team — TeamPage reads :id and checks id === 'new' */}
      <Route
        path="/team/:id"
        element={<PrivateRoute><DesktopShell><TeamPage /></DesktopShell></PrivateRoute>}
      />

      {/* Secondary */}
      <Route
        path="/profile"
        element={<PrivateRoute><DesktopShell><ProfilePage /></DesktopShell></PrivateRoute>}
      />

      {/* Legacy redirect */}
      <Route path="/matches" element={<Navigate to="/team" replace />} />

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
