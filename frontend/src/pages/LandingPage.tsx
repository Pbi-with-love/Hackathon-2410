import { Link } from 'react-router-dom';
import CanvasMap from '../components/CanvasMap';
import type { MapMarker } from '../components/CanvasMap';

/** Mock markers for the demo map — spread across all 5 buildings */
const DEMO_MARKERS: MapMarker[] = [
  // Sahkotalo
  { id: 'd1', name: 'SmartFlow', lat: 61.49728, lng: 23.75599, role: 'Frontend Dev', type: 'team' },
  { id: 'd2', name: 'James', lat: 61.49694, lng: 23.75589, role: 'Mentor', type: 'mentor' },
  // Rakennustalo
  { id: 'd3', name: 'MindBridge', lat: 61.49741, lng: 23.75952, role: 'ML Engineer', type: 'team' },
  { id: 'd4', name: 'Dr. Maria', lat: 61.49724, lng: 23.75972, role: 'Mentor', type: 'mentor' },
  // Tietotalo
  { id: 'd5', name: 'GreenGrid', lat: 61.49799, lng: 23.75058, role: 'Backend Dev', type: 'team' },
  { id: 'd6', name: 'Sofia', lat: 61.49794, lng: 23.75085, role: 'Backend Dev', type: 'participant' },
  // Noodi
  { id: 'd7', name: 'LearnLoop', lat: 61.49829, lng: 23.75554, role: 'UX Designer', type: 'team' },
  { id: 'd8', name: 'Emma', lat: 61.49833, lng: 23.75552, role: 'Frontend Dev', type: 'participant' },
  // Konetalo
  { id: 'd9', name: 'QuestCity', lat: 61.49452, lng: 23.75502, role: 'Mobile Dev', type: 'team' },
  { id: 'd10', name: 'Priya', lat: 61.49437, lng: 23.75532, role: 'Mentor', type: 'mentor' },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--ground)' }}>
      {/* ── HERO ── ~80vh, 5/12 text + 7/12 map */}
      <section
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--sp-16) 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: '5fr 7fr',
            gap: 'var(--sp-12)',
            alignItems: 'center',
          }}
        >
          {/* Text column */}
          <div>
            <h1
              className="heading-display"
              style={{
                fontSize: 'var(--text-3xl)',
                marginBottom: 'var(--sp-5)',
              }}
            >
              Nobody hacks alone.
            </h1>
            <p
              style={{
                fontFamily: 'var(--body)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted)',
                lineHeight: 1.55,
                marginBottom: 'var(--sp-8)',
                maxWidth: 440,
              }}
            >
              Arrive solo, find a team that fits, and the right mentor — all in
              one place.
            </p>
            <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
              <Link
                to="/match"
                className="btn primary"
                style={{
                  padding: '12px 28px',
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none',
                  height: 'auto',
                }}
              >
                Find my team
              </Link>
              <Link
                to="/map/teams"
                className="btn"
                style={{
                  padding: '12px 28px',
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none',
                  height: 'auto',
                }}
              >
                Open the map
              </Link>
            </div>
          </div>

          {/* Live demo map */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 10',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <CanvasMap markers={DEMO_MARKERS} demoMode />
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── qualitative headlines, no unsourced stats */}
      <section style={{ padding: 'var(--sp-12) 0 var(--sp-16)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--sp-6)',
            }}
          >
            {[
              {
                headline: 'Late starts',
                text: 'Solo arrivals waste hours searching for a team — some never find one.',
              },
              {
                headline: 'Blind recruiting',
                text: 'Teams recruit by chance, not by fit. Skill gaps stay unfilled.',
              },
              {
                headline: 'Hidden help',
                text: 'Mentors are in the building but nobody knows where or who to ask.',
              },
            ].map((item) => (
              <div key={item.headline} className="card">
                <div
                  className="heading-display"
                  style={{
                    fontSize: 'var(--text-xl)',
                    color: 'var(--accent)',
                    marginBottom: 'var(--sp-3)',
                  }}
                >
                  {item.headline}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--muted)',
                    lineHeight: 1.55,
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: 'var(--sp-16) 0' }}>
        <div className="container">
          <h2
            className="heading-display"
            style={{
              fontSize: 'var(--text-xl)',
              marginBottom: 'var(--sp-10)',
            }}
          >
            How it works
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--sp-8)',
            }}
          >
            {[
              {
                title: 'Tell us in one sentence',
                desc: 'Describe your skills, interests and preferred role in plain language.',
              },
              {
                title: 'Ranked matches with reasons',
                desc: 'See teams ranked by fit with a friendly explanation for each.',
              },
              {
                title: 'Meet on the map',
                desc: 'Find your new team on the venue map and walk over.',
              },
            ].map((item, i) => (
              <div key={item.title}>
                <div
                  className="meta-label"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--accent)',
                    marginBottom: 'var(--sp-3)',
                  }}
                >
                  Step {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginBottom: 'var(--sp-2)',
                  }}
                >
                  {item.title}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--muted)',
                    lineHeight: 1.55,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAIR MATCHING ── */}
      <section style={{ padding: 'var(--sp-16) 0' }}>
        <div className="container">
          <div
            className="card"
            style={{ maxWidth: 720 }}
          >
            <h2
              className="meta-label"
              style={{ marginBottom: 'var(--sp-4)' }}
            >
              Fair matching
            </h2>
            <p
              style={{
                fontFamily: 'var(--body)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted)',
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: 'var(--accent)' }}>Both sides agree</span>{' '}
              before any match happens. Only best-fit teams get notified. Your
              location is shown by{' '}
              <span style={{ color: 'var(--accent)' }}>zone only</span> — and{' '}
              <span style={{ color: 'var(--accent)' }}>hidden once you join</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ── LIVE NOW STRIP ── */}
      <section
        style={{
          background: 'var(--raised)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: 'var(--sp-5) 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
            {[
              '8 teams recruiting',
              '12 people looking',
              '6 mentors available',
            ].map((label) => (
              <span
                key={label}
                className="meta-label"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}
              >
                {label}
              </span>
            ))}
          </div>
          <Link
            to="/match"
            className="btn primary"
            style={{
              padding: '8px 20px',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
            }}
          >
            Find my team
          </Link>
        </div>
      </section>
    </div>
  );
}
