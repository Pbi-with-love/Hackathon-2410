import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { apiFetch } from '../lib/api.ts';

interface Toast {
  id: string;
  matchId: string;
  message: string;
  direction: 'team_to_participant' | 'participant_to_team';
}

export default function MatchNotifications() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const captainTeamIds = useRef<Set<string>>(new Set());

  // Fetch teams where the current user is captain
  useEffect(() => {
    if (!user) return;
    apiFetch('/teams')
      .then(async (res) => {
        if (!res.ok) return;
        const teams = (await res.json()) as Array<{ id: string; captain_id: string }>;
        captainTeamIds.current = new Set(
          teams.filter((t) => t.captain_id === user.id).map((t) => t.id)
        );
      })
      .catch(() => {
        // ignore — notifications will still work for participant matches
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row) return;

          const isParticipant = row['participant_id'] === user.id;
          const isCaptainOfTeam = captainTeamIds.current.has(row['team_id'] as string);
          const isForMe = isParticipant || isCaptainOfTeam;

          if (!isForMe) return;

          const state = row['state'] as string;
          if (state !== 'invited' && state !== 'requested') return;

          const matchId = row['id'] as string;
          const message =
            state === 'invited'
              ? 'A team has invited you to join them!'
              : 'A participant has requested to join your team!';

          setToasts((prev) => [
            ...prev,
            { id: `${matchId}-${Date.now()}`, matchId, message, direction: row['direction'] as Toast['direction'] },
          ]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const respond = async (matchId: string, action: 'accept' | 'decline', toastId: string) => {
    try {
      await apiFetch(`/match/${matchId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
    } catch {
      // ignore — user sees result on next page load
    }
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm font-medium text-gray-900 mb-3">{toast.message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => respond(toast.matchId, 'accept', toast.id)}
              className="flex-1 bg-green-600 text-white text-sm py-1 px-3 rounded hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => respond(toast.matchId, 'decline', toast.id)}
              className="flex-1 bg-gray-200 text-gray-700 text-sm py-1 px-3 rounded hover:bg-gray-300"
            >
              Decline
            </button>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-600 px-1"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
