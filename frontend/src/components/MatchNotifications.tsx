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
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}
        >
          <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', marginBottom: 12, lineHeight: 1.6 }}>{toast.message}</p>
          <div className="flex gap-2">
            <button
              onClick={() => void respond(toast.matchId, 'accept', toast.id)}
              className="pixel-btn primary flex-1 cursor-pointer"
              style={{ padding: '6px', fontSize: 12 }}
            >
              Accept
            </button>
            <button
              onClick={() => void respond(toast.matchId, 'decline', toast.id)}
              className="pixel-btn flex-1 cursor-pointer"
              style={{ padding: '6px', fontSize: 12 }}
            >
              Decline
            </button>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="pixel-btn cursor-pointer"
              style={{ padding: '6px 8px', fontSize: 12 }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
