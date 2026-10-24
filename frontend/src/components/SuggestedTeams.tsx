import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

interface TeamSuggestion {
  teamId: string;
  teamName: string;
  projectIdea: string;
  neededRoles: string[];
  score: number;
  reasons: string[];
  lat: number | null;
  lng: number | null;
}

export default function SuggestedTeams() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<TeamSuggestion[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/match/teams/${user.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error ?? 'Failed to load suggestions');
        }
        return res.json() as Promise<{ suggestions: TeamSuggestion[] }>;
      })
      .then((data) => setSuggestions(data.suggestions))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleRequestJoin = async (teamId: string) => {
    try {
      const res = await apiFetch('/match/request', {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error: string };
        alert(body.error ?? 'Request failed');
      } else {
        alert('Request sent!');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 z-[1000] bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.18)] overflow-hidden font-sans">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 bg-blue-800 text-white cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="font-bold text-sm">Suggested for you</span>
        <span className="text-xs">{collapsed ? '\u25BC' : '\u25B2'}</span>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="max-h-[70vh] overflow-y-auto">
          {loading && (
            <p className="p-3 text-sm text-gray-500">
              Loading suggestions...
            </p>
          )}
          {error && (
            <p className="p-3 text-sm text-red-600">
              {error}
            </p>
          )}
          {!loading && !error && suggestions.length === 0 && (
            <p className="p-3 text-sm text-gray-500">
              No matching teams found yet.
            </p>
          )}
          {suggestions.map((s) => (
            <div
              key={s.teamId}
              className="px-3.5 py-3 border-b border-gray-200"
            >
              <div className="font-bold text-sm text-gray-900">
                {s.teamName}
              </div>
              {s.projectIdea && (
                <div
                  className="text-xs text-gray-500 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={s.projectIdea}
                >
                  {s.projectIdea}
                </div>
              )}
              {/* Matched roles as green tags */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {s.neededRoles.map((role) => (
                  <span
                    key={role}
                    className="bg-green-100 text-green-700 text-[0.7rem] px-2 py-0.5 rounded-full font-semibold"
                  >
                    {role}
                  </span>
                ))}
              </div>
              {/* Reasons */}
              {s.reasons.map((reason, i) => (
                <div
                  key={i}
                  className="text-xs text-gray-700 mt-1"
                >
                  {reason}
                </div>
              ))}
              <button
                onClick={() => void handleRequestJoin(s.teamId)}
                className="mt-2 w-full py-1.5 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600"
              >
                Request to Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
