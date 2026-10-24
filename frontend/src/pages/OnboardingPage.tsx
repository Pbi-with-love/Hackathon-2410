import { Link } from 'react-router-dom';
import ProfileExtractor from '../components/ProfileExtractor';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--ground)' }}>
      <div className="max-w-2xl mx-auto">
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--px)', fontSize: 16, color: 'var(--accent)', letterSpacing: '.05em', marginBottom: 6 }}>0%</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>CONET</div>
          <div className="screen-title">Setup profile</div>
          <p style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--muted)' }}>
            Type a few lines and we'll build your profile automatically
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <ProfileExtractor />
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            to="/map/teams"
            style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
