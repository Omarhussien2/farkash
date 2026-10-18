import { GAMES, type GameSession, type GameId } from '@/types';

function averageReaction(sessions: GameSession[]) {
  const timed = sessions.filter((session) => session.reactionMs > 0);
  return timed.length ? Math.round(timed.reduce((sum, session) => sum + session.reactionMs, 0) / timed.length) : 0;
}

/** Compare equal, non-overlapping sets within one game, never across games. */
export function gameProgress(sessions: GameSession[], now = new Date()) {
  return GAMES.map((game) => {
    const history = sessions.filter((session) => !session.id.startsWith('seed-') && session.game === game.id && new Date(session.date).getTime() <= now.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recent = history.slice(-3);
    const baseline = history.slice(0, 3);
    const mean = (items: GameSession[], field: 'score' | 'impulsiveErrors') => items.reduce((sum, item) => sum + item[field], 0) / items.length;
    const comparable = history.length >= 6 && game.id !== 'nafas';
    return {
      game: game.id, count: history.length,
      recentScore: recent.length ? Math.round(mean(recent, 'score')) : null,
      baselineScore: comparable ? Math.round(mean(baseline, 'score')) : null,
      scoreChange: comparable ? Math.round(mean(recent, 'score') - mean(baseline, 'score')) : null,
      errorChange: comparable ? Math.round((mean(recent, 'impulsiveErrors') - mean(baseline, 'impulsiveErrors')) * 10) / 10 : null,
      firstDate: history[0]?.date,
      lastDate: history[history.length - 1]?.date,
    };
  });
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

  return {
    last7,
    avgReaction,
    totalPatience: Math.round(totalPatience),
    totalErrors,
    avgScore,
    perDay,
    perGame,
    sessionsCount: last7.length,
  };
}
