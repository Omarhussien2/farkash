import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { gameProgress } from '@/utils/report';
import { Report } from '@/components/Report';
import { AppProvider } from '@/store/AppContext';
import type { GameSession } from '@/types';

const now = new Date('2026-10-18T18:00:00');
const session: GameSession = { id: 'real', game: 'aks', date: '2026-10-18T12:00:00', score: 40, impulsiveErrors: 3, reactionMs: 500, patienceSec: 5 };
const history = [40, 50, 60, 70, 80, 90].map((score, index) => ({ ...session, id: `real-${index}`, score, impulsiveErrors: index < 3 ? 3 : 1, date: `2026-10-${12 + index}T12:00:00` }));

describe('personal progress comparisons', () => {
  it('compares first and latest three in chronological order, excluding samples, future plays and other games', () => {
    const mixed = [...history].reverse().concat([
      { ...session, id: 'seed-example', score: 100 },
      { ...session, id: 'future', date: '2026-10-19T00:00:00', score: 0 },
      { ...session, id: 'other-game', game: 'sabr', score: 0 },
    ]);
    const progress = gameProgress(mixed, now);
    expect(progress.find((item) => item.game === 'aks')).toMatchObject({ count: 6, recentScore: 80, scoreChange: 30, errorChange: -2 });
    expect(progress.find((item) => item.game === 'sabr')).toMatchObject({ count: 1, scoreChange: null });
    expect(mixed[0].id).toBe('real-5');
  });

  it('never overlaps comparison groups or treats breathing completion as emotional improvement', () => {
    expect(gameProgress(history.slice(0, 5), now).find((item) => item.game === 'aks')?.scoreChange).toBeNull();
    expect(gameProgress(history.map((item) => ({ ...item, game: 'nafas' })), now).find((item) => item.game === 'nafas')).toMatchObject({ count: 6, scoreChange: null, errorChange: null });
  });

  it('shows declines and stable performance without disguising them as improvement', () => {
    expect(gameProgress(history.map((item) => ({ ...item, score: 100 - item.score })), now).find((item) => item.game === 'aks')?.scoreChange).toBe(-30);
    expect(gameProgress(history.map((item) => ({ ...item, score: 70 })), now).find((item) => item.game === 'aks')?.scoreChange).toBe(0);
  });
});

it('keeps sample history separate and lets parents start a suggested game', () => {
  localStorage.setItem('farkash.state.v1', JSON.stringify({ settings: { lang: 'ar', sound: false, speech: false }, sessions: [{ ...session, id: 'seed-example', date: new Date().toISOString() }] }));
  const onSelect = vi.fn();
  render(<AppProvider><Report onSelect={onSelect} /></AppProvider>);
  expect(screen.getByText('أول خطوة تبدأ بلعبة معًا')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'نجرب تحدي الصبر' }));
  expect(onSelect).toHaveBeenCalledWith('sabr');
  fireEvent.click(screen.getByRole('button', { name: 'استكشاف نموذج تقرير تجريبي' }));
  expect(screen.getByRole('status').textContent).toContain('لا تخص طفلك');
  expect(screen.queryByRole('heading', { name: 'هل الأداء بيتغيّر؟' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'عرض بيانات اللعب الحقيقي' }));
  expect(screen.getByText('أول خطوة تبدأ بلعبة معًا')).toBeTruthy();
});

it('renders both comparison scores for a real game history', () => {
  localStorage.setItem('farkash.state.v1', JSON.stringify({ settings: { lang: 'en', sound: false, speech: false }, sessions: history }));
  render(<AppProvider><Report onSelect={vi.fn()} /></AppProvider>);
  expect(screen.getByText('+30 points')).toBeTruthy();
  expect(screen.getByRole('meter', { name: 'First 3' }).getAttribute('value')).toBe('50');
  expect(screen.getByRole('meter', { name: 'Latest 3' }).getAttribute('value')).toBe('80');
  expect(screen.getByText(/Change in average errors per attempt: -2/)).toBeTruthy();
});
