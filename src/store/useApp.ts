import { createContext, useContext } from 'react';
import type { GameSession, Lang } from '@/types';

export interface Settings {
  lang: Lang;
  sound: boolean;
  speech: boolean;
}

export interface AppState {
  settings: Settings;
  sessions: GameSession[];
  setLang: (l: Lang) => void;
  toggleSound: () => void;
  toggleSpeech: () => void;
  addSession: (s: Omit<GameSession, 'id' | 'date'>) => void;
  resetData: () => void;
}

const Ctx = createContext<AppState | null>(null);

export { Ctx };

export function useApp(): AppState {
  const context = useContext(Ctx);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
