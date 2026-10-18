import { useEffect, useRef } from 'react';
import { useApp } from '@/store/useApp';
import type { GameSession } from '@/types';

export function useRecordSession(finished: boolean, session: Omit<GameSession, 'id' | 'date'>) {
  const { addSession } = useApp();
  const recorded = useRef(false);
  const { game, reactionMs, patienceSec, impulsiveErrors, score } = session;
  useEffect(() => {
    if (!finished) {
      recorded.current = false;
      return;
    }
    if (recorded.current) return;
    recorded.current = true;
    addSession({ game, reactionMs, patienceSec, impulsiveErrors, score });
  }, [finished, addSession, game, reactionMs, patienceSec, impulsiveErrors, score]);
}
