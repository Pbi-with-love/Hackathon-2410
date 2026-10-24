import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

interface TopNavProps {
  notificationCount?: number;
}

export default function TopNav({ notificationCount = 0 }: TopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/match', label: 'Find my match' },
    { to: '/map/teams', label: 'Team map' },
    { to: '/map/mentors', label: 'Mentor map' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav
      style={{
        height: 48,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--gutter)',
        maxWidth: 'var(--container)',
        margin: '0 auto',
        gap: 4,
      }}
    >
      {/* Logo lockup — both words in display font, same baseline */}
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          marginRight: 28,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--accent)',
            lineHeight: 1,
          }}
        >
          0%
        </span>
        <span
          style={{
            fontFamily: 'var(--display)',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--muted)',
            lineHeight: 1,
          }}
        >
          CONET
        </span>
      </Link>

      {/* Nav links — 14px, sentence case, active = text color change */}
      {navLinks.map(({ to, label }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            style={{
              fontFamily: 'var(--font)',
              fontSize: 14,
              fontWeight: active ? 500 : 400,
              color: active ? 'var(--text)' : 'var(--muted)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 0,
              background: active ? 'var(--raised)' : 'transparent',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                (e.currentTarget as HTMLElement).style.background = 'var(--raised)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            {label}
          </Link>
        );
      })}

      {/* Right cluster */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Notification bell */}
        {isAuthenticated && (
          <button
            onClick={() => navigate('/matches')}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              color: notificationCount > 0 ? 'var(--accent)' : 'var(--muted)',
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={`${notificationCount} invitations`}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13.5 6.75a4.5 4.5 0 1 0-9 0c0 4.5-2.25 5.625-2.25 5.625h13.5s-2.25-1.125-2.25-5.625" />
              <path d="M10.3 14.25a1.5 1.5 0 0 1-2.6 0" />
            </svg>
            {notificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: 'var(--negative)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  width: 14,
                  height: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* User menu */}
        {isAuthenticated ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '4px 10px 4px 4px',
                cursor: 'pointer',
                height: 32,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  background: 'var(--accent)',
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 400 }}>
                {user?.name?.split(' ')[0]}
              </span>
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  zIndex: 50,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  minWidth: 160,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {[
                  { to: '/profile', label: 'Profile' },
                  { to: '/matches', label: 'Invitations', count: notificationCount },
                ].map(({ to, label, count }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding: '10px 16px',
                      fontSize: 13,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--raised)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {label}
                    {count != null && count > 0 && (
                      <span
                        style={{
                          background: 'var(--negative)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '50%',
                          minWidth: 18,
                          textAlign: 'center',
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                    navigate('/login');
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: 13,
                    color: 'var(--negative)',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--raised)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="btn"
            style={{ textDecoration: 'none', height: 32, fontSize: 13 }}
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
    </nav>
  );
}
