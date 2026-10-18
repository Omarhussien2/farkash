import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/store/AppContext';
import { useApp } from '@/store/useApp';
import { useRecordSession } from '@/hooks/useRecordSession';
import { NafasGame } from '@/games/NafasGame';
import { reportStats } from '@/utils/report';
import type { GameSession } from '@/types';

const session: GameSession = { id: 'real-session', date: '2026-10-18T12:00:00', game: 'aks', reactionMs: 420, patienceSec: 8, impulsiveErrors: 1, score: 87 };
const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function saveState(sessions: unknown[] = []) {
  localStorage.setItem('farkash.state.v1', JSON.stringify({ settings: { lang: 'en', sound: false, speech: false }, sessions }));
}
function History() {
  const { sessions } = useApp();
  return <output aria-label="session history">{JSON.stringify(sessions)}</output>;
}
function readHistory(): GameSession[] { return JSON.parse(screen.getByLabelText('session history').textContent!); }
function Recorder({ finished }: { finished: boolean }) {
  useRecordSession(finished, session);
  return <History />;
}

describe('session and game regressions', () => {
  it('saves each completed run once through Strict Mode and rerenders', () => {
    saveState();
    const view = (finished: boolean) => <StrictMode><AppProvider><Recorder finished={finished} /></AppProvider></StrictMode>;
    const { rerender } = render(view(true));
    expect(readHistory()).toHaveLength(1);
    rerender(view(true));
    expect(readHistory()).toHaveLength(1);
    rerender(view(false));
    rerender(view(true));
    expect(readHistory()).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem('farkash.state.v1')!).sessions).toHaveLength(2);
  });

  it('preserves valid history while discarding malformed saved sessions', () => {
    saveState([session, { ...session, id: 'seed-broken', reactionMs: -70 }, null]);
    render(<AppProvider><History /></AppProvider>);
    expect(readHistory()).toEqual([session]);
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('finishes all four breathing rounds and saves one completed session', () => {
    vi.useFakeTimers();
    saveState();
    render(<AppProvider><NafasGame onExit={() => {}} /><History /></AppProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => { vi.advanceTimersByTime(54_000); });
    expect(readHistory()).toHaveLength(1);
    expect(readHistory()[0]).toMatchObject({ game: 'nafas', score: 100, patienceSec: 48 });
  });


});

describe('seven-day reporting', () => {
  it('excludes breathing sessions from reaction averages and future or old sessions from the week', () => {
    const sessions: GameSession[] = [session,
      { ...session, id: 'breath', game: 'nafas', reactionMs: 0 },
      { ...session, id: 'future', date: '2026-10-19T12:00:00' },
      { ...session, id: 'old', date: '2026-10-11T23:59:59' },
      { ...session, id: 'boundary', date: '2026-10-12T00:00:00', reactionMs: 600 },
    ];
    const stats = reportStats(sessions, labels, new Date('2026-10-18T18:00:00'));
    expect(stats.sessionsCount).toBe(3);
    expect(stats.avgReaction).toBe(510);
    expect(stats.perDay[6].reaction).toBe(420);
    expect(stats.perDay.map((day) => day.count)).toEqual([1, 0, 0, 0, 0, 0, 2]);
  });

  it('shows no mastery or impulse-control claim without play history', () => {
    const stats = reportStats([], labels);
    expect(stats.avgScore).toBe(0);
    expect(stats.avgReaction).toBe(0);
    expect(stats.sessionsCount).toBe(0);
  });
});
