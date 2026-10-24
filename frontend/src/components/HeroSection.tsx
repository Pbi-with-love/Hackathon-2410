import { Link } from 'react-router-dom';

interface HeroProps {
  totalTeams: number;
  totalParticipants: number;
  totalMentors: number;
}

export default function HeroSection({ totalTeams, totalParticipants, totalMentors }: HeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center gap-6">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <p className="text-blue-300 text-xs font-semibold tracking-widest uppercase mb-1">
            Tampere University &middot; Hervanta Campus
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-2">
            Junction Hackathon
          </h1>
          <p className="text-blue-200 text-sm md:text-base max-w-md leading-relaxed">
            Find your dream team, connect with mentors, and build something amazing — all on the campus map.
          </p>
        </div>

        {/* Right: stat cards */}
        <div className="flex gap-3 flex-shrink-0">
          <StatCard label="Teams" value={totalTeams} color="bg-blue-700/60" />
          <StatCard label="Hackers" value={totalParticipants} color="bg-indigo-700/60" />
          <StatCard label="Mentors" value={totalMentors} color="bg-violet-700/60" />
        </div>
      </div>

      {/* Nav row */}
      <div className="relative border-t border-white/10">
        <nav className="max-w-6xl mx-auto px-6 flex items-center gap-1 py-1.5 text-sm">
          <NavLink to="/map/teams">Team Map</NavLink>
          <NavLink to="/map/mentors">Mentor Map</NavLink>
          <NavLink to="/matches">Matches</NavLink>
          <Link
            to="/profile"
            className="ml-auto text-blue-300 hover:text-white px-3 py-1 rounded transition-colors cursor-pointer"
          >
            Profile
          </Link>
        </nav>
      </div>
    </section>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className={`${color} backdrop-blur-sm rounded-xl px-5 py-3 text-center min-w-[5.5rem] border border-white/10`}
    >
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-blue-200 text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-white/15 text-white'
          : 'text-blue-300 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  );
}
