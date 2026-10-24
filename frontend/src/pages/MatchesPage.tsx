import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.ts';

interface Match {
  id: string;
  state: string;
  direction: string;
  team: { id: string; name: string; project_idea: string };
  participant: { id: string; name: string; roles: string[] };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await apiFetch('/matches') as unknown as { matches: Match[] };
      setMatches(data.matches ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const respond = async (matchId: string, action: 'accept' | 'decline') => {
    await apiFetch(`/match/${matchId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    void load();
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (matches.length === 0) return <div className="p-8 text-gray-500">No pending matches.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Matches</h1>
      <div className="flex flex-col gap-4">
        {matches.map((m) => (
          <div key={m.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">{m.team?.name}</p>
                <p className="text-sm text-gray-600">{m.team?.project_idea}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {m.direction === 'team_to_participant' ? 'Team invited you' : 'You requested to join'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => respond(m.id, 'accept')}
                className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
              >
                Accept
              </button>
              <button
                onClick={() => respond(m.id, 'decline')}
                className="bg-gray-200 text-gray-700 px-4 py-1 rounded text-sm hover:bg-gray-300"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
