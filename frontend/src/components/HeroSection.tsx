import { Link, useLocation } from 'react-router-dom';

interface NavBarProps {
  stats?: { teams?: number; participants?: number; mentors?: number };
}

export default function NavBar({ stats }: NavBarProps) {
  const location = useLocation();

  const links = [
    { to: '/map/teams', label: 'Team Map' },
    { to: '/map/mentors', label: 'Mentors' },
    { to: '/matches', label: 'Matches' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="flex items-center gap-1 px-4 py-2 flex-shrink-0"
      style={{ background: 'var(--surface)', borderBottom: '2px solid var(--line)' }}>

      {/* Wordmark */}
      <Link to="/map/teams" className="mr-4" style={{ textDecoration: 'none' }}>
        <div style={{ fontFamily: 'var(--px)', fontSize: '13px', color: 'var(--primary)', letterSpacing: '.05em' }}>
          JUNCTION
        </div>
        <div style={{ fontFamily: 'var(--px)', fontSize: '9px', color: 'var(--muted)', marginTop: 2 }}>
          Hervanta Campus
        </div>
      </Link>

      {/* Nav links */}
      {links.map(({ to, label }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to}
            className="px-3 py-1 cursor-pointer"
            style={{
              fontFamily: 'var(--px)',
              fontSize: '8px',
              color: active ? 'var(--primary)' : 'var(--muted)',
              background: 'transparent',
              textDecoration: 'none',
            }}>
            {label}
          </Link>
        );
      })}

      {/* Stats (right-aligned, inline, small) */}
      {stats && (
        <div className="ml-auto flex items-center gap-3" style={{ fontFamily: 'var(--px)', fontSize: '7px', color: 'var(--muted)' }}>
          {stats.teams !== undefined && stats.teams > 0 && <span>{stats.teams} teams</span>}
          {stats.participants !== undefined && stats.participants > 0 && <span>{stats.participants} hackers</span>}
          {stats.mentors !== undefined && stats.mentors > 0 && <span>{stats.mentors} mentors</span>}
        </div>
      )}
    </nav>
  );
}
