import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { GAMES, type GameId, type GameSession, type Lang } from '@/types';
import { Ctx, type Settings, type AppState } from '@/store/useApp';
import { setSpeechEnabled } from '@/utils/speech';
import { setSoundEnabled } from '@/utils/egyptianAudioEngine';

const LS_KEY = 'farkash.state.v1';

function isPersistedState(candidate: unknown): candidate is { settings: Settings; sessions: GameSession[] } {
  if (!candidate || typeof candidate !== 'object') return false;
  const { settings, sessions } = candidate as { settings?: Partial<Settings>; sessions?: unknown };
  return !!settings && (settings.lang === 'ar' || settings.lang === 'en') &&
    typeof settings.sound === 'boolean' && typeof settings.speech === 'boolean' &&
    Array.isArray(sessions);
}

function isGameSession(candidate: unknown): candidate is GameSession {
  if (!candidate || typeof candidate !== 'object') return false;
  const session = candidate as GameSession;
  return typeof session.id === 'string' && typeof session.date === 'string' &&
    Number.isFinite(Date.parse(session.date)) && GAMES.some((game) => game.id === session.game) &&
    [session.reactionMs, session.patienceSec, session.impulsiveErrors, session.score]
      .every((metric) => typeof metric === 'number' && Number.isFinite(metric) && metric >= 0) && session.score <= 100;
}

function loadPersisted(): { settings: Settings; sessions: GameSession[] } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { settings: Settings; sessions: GameSession[] };
      if (isPersistedState(parsed)) return { settings: parsed.settings, sessions: parsed.sessions.filter(isGameSession) };
    }
  } catch {
    console.warn('Could not restore saved Farkash state; using demo data.');
  }
  return { settings: { lang: 'ar', sound: true, speech: true }, sessions: seedSessions() };
}

function seedSessions(): GameSession[] {
  // Pre-populated demo data across the last 7 days for judges.
  const out: GameSession[] = [];
  const games: GameId[] = ['karasina', 'tamathil', 'ishara', 'aks', 'sabr', 'nafas'];
  const now = Date.now();
  for (let d = 6; d >= 0; d--) {
    const dayStart = now - d * 86400000;
    // 1-3 sessions per day
    const count = 1 + (d % 3);
    for (let i = 0; i < count; i++) {
      const g = games[(d + i) % games.length];
      const improvement = (6 - d) * 8; // gets better over the week
      const baseReaction = Math.max(150, 720 - improvement * 8 + (Math.random() * 120 - 60));
      const basePatience = 6 + (6 - d) * 1.5 + (Math.random() * 2 - 1);
      const baseErrors = Math.max(0, 5 - Math.floor((6 - d) / 2) + (Math.random() < 0.3 ? 1 : 0));
      const score = Math.min(100, Math.max(40, 55 + improvement + Math.round(Math.random() * 10)));
      out.push({
        id: `seed-${d}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        game: g,
        date: new Date(dayStart + i * 3600000).toISOString(),
        reactionMs: Math.round(baseReaction),
        patienceSec: Math.round(basePatience * 10) / 10,
        impulsiveErrors: Math.round(baseErrors),
        score,
      });
    }
  }
  return out;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(loadPersisted, []);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [sessions, setSessions] = useState<GameSession[]>(initial.sessions);

  useEffect(() => {
    document.documentElement.lang = settings.lang;
    document.documentElement.dir = settings.lang === 'ar' ? 'rtl' : 'ltr';
  }, [settings.lang]);

  useEffect(() => {
    setSoundEnabled(settings.sound);
  }, [settings.sound]);

  useEffect(() => {
    setSpeechEnabled(settings.speech);
  }, [settings.speech]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ settings, sessions }));
    } catch {
      console.warn('Farkash changes could not be saved on this device.');
    }
  }, [settings, sessions]);

  const setLang = useCallback((l: Lang) => {
    setSettings((s) => ({ ...s, lang: l }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((s) => ({ ...s, sound: !s.sound }));
  }, []);

  const toggleSpeech = useCallback(() => {
    setSettings((s) => ({ ...s, speech: !s.speech }));
  }, []);

  const addSession = useCallback((s: Omit<GameSession, 'id' | 'date'>) => {
    const session: GameSession = {
      ...s,
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
    };
    setSessions((prev) => [...prev, session]);

  }, []);

  const resetData = useCallback(() => {
    setSessions(seedSessions());
  }, []);

  const value: AppState = {
    settings,
    sessions,
    setLang,
    toggleSound,
    toggleSpeech,
    addSession,
    resetData,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
