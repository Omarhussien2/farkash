import { GAMES, type GameSession, type GameId } from '@/types';

function averageReaction(sessions: GameSession[]) {
  const timed = sessions.filter((session) => session.reactionMs > 0);
  return timed.length ? Math.round(timed.reduce((sum, session) => sum + session.reactionMs, 0) / timed.length) : 0;
}

export function reportStats(sessions: GameSession[], dayLabels: string[], now = new Date()) {
  const last7 = sessions.filter((s) => {
    const days = (now.getTime() - new Date(s.date).getTime()) / 86400000;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);
    return days >= 0 && new Date(s.date).getTime() >= weekStart.getTime();
  });
  const avgReaction = averageReaction(last7);
  const totalPatience = last7.reduce((a, s) => a + s.patienceSec, 0);
  const totalErrors = last7.reduce((a, s) => a + s.impulsiveErrors, 0);
  const avgScore =
    last7.length > 0
      ? Math.round(last7.reduce((a, s) => a + s.score, 0) / last7.length)
      : 0;

  // Per-day aggregates for last 7 days
  const perDay: { label: string; score: number; reaction: number; count: number }[] = [];
  for (let d = 6; d >= 0; d--) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - d);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const daySess = last7.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });
    perDay.push({
      label: dayLabels[dayStart.getDay()],
      score: daySess.length > 0 ? Math.round(daySess.reduce((a, s) => a + s.score, 0) / daySess.length) : 0,
      reaction: averageReaction(daySess),
      count: daySess.length,
    });
  }

  // Per-game mastery
  const perGame: { game: GameId; avgScore: number; count: number }[] = GAMES.map((g) => {
    const gs = last7.filter((s) => s.game === g.id);
    return {
      game: g.id,
      avgScore: gs.length > 0 ? Math.round(gs.reduce((a, s) => a + s.score, 0) / gs.length) : 0,
      count: gs.length,
    };
  });

  // Impulse control %: starts at 100, each error-per-session average costs 20 points.
  const impulseControl = last7.length === 0 ? 0 : Math.max(
    0,
    Math.min(100, Math.round(100 - (totalErrors / Math.max(1, last7.length)) * 20))
  );

  return {
    last7,
    avgReaction,
    totalPatience: Math.round(totalPatience),
    totalErrors,
    avgScore,
    impulseControl,
    perDay,
    perGame,
    sessionsCount: last7.length,
  };
}
