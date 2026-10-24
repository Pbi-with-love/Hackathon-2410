import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--ground)', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--primary)', letterSpacing: '.05em', marginBottom: 6 }}>JUNCTION</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--muted)' }}>Hervanta Campus</div>
      </div>

      <div style={{ width: '100%', maxWidth: 340 }}>
        <div className="screen-title" style={{ marginBottom: 4 }}>CREATE ACCOUNT</div>
        <div className="screen-sub">Join the hackathon and find your team.</div>

        {error && (
          <div style={{ background: 'var(--surface)', border: '1px solid #7a3a3a', color: '#f87171', fontFamily: 'var(--sans)', fontSize: 12, padding: '8px 12px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)}>
          <label>
            <span className="field-label">NAME</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
              placeholder="Your full name"
            />
          </label>

          <label>
            <span className="field-label">EMAIL</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              placeholder="you@example.com"
            />
          </label>

          <label>
            <span className="field-label">PASSWORD <span style={{ color: 'var(--muted)' }}>(min 8 chars)</span></span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              placeholder="••••••••"
            />
          </label>

          <label>
            <span className="field-label">ROLE</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="field-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="participant">Participant</option>
              <option value="mentor">Mentor</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="pixel-btn primary"
            style={{ width: '100%', padding: '10px', fontSize: 12, opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12, textAlign: 'center', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
