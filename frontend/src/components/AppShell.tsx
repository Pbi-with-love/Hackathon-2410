import { Link, useLocation } from 'react-router-dom';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const tabs = [
    {
      to: '/profile',
      label: 'ME',
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="6" r="3"/>
          <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
        </svg>
      ),
    },
    {
      to: '/matches',
      label: 'TEAM',
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="2.5"/>
          <circle cx="12" cy="6" r="2.5"/>
          <path d="M1 16c0-2.8 2.2-5 5-5"/>
          <path d="M17 16c0-2.8-2.2-5-5-5"/>
          <path d="M6 11c0-1.7 1.3-3 3-3s3 1.3 3 3v5H6v-5z"/>
        </svg>
      ),
    },
    {
      to: '/map/teams',
      label: 'MAP',
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="1,4 7,2 11,4 17,2 17,14 11,16 7,14 1,16"/>
          <line x1="7" y1="2" x2="7" y2="14"/>
          <line x1="11" y1="4" x2="11" y2="16"/>
        </svg>
      ),
    },
    {
      to: '/map/mentors',
      label: 'MENTOR',
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="9" r="2.5"/>
          <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4"/>
        </svg>
      ),
    },
    {
      to: '/team/new',
      label: 'EVENT',
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="14" height="12" rx="1"/>
          <line x1="6" y1="2" x2="6" y2="6"/>
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="2" y1="8" x2="16" y2="8"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        padding: '14px 16px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg)',
        borderBottom: '2px solid var(--line)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--px)', fontSize: 13, color: 'var(--primary)', letterSpacing: '.05em' }}>JUNCTION</div>
          <div style={{ fontFamily: 'var(--px)', fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>Hervanta Campus</div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        borderTop: '2px solid var(--line)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        {tabs.map(({ to, label, icon }) => {
          const active =
            location.pathname === to ||
            (to === '/map/teams' && location.pathname === '/map/teams') ||
            (to === '/map/mentors' && location.pathname === '/map/mentors');
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                textDecoration: 'none',
                color: active ? 'var(--primary)' : 'var(--muted)',
                minHeight: 56,
                fontFamily: 'var(--px)',
                fontSize: 6,
              }}
            >
              <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
