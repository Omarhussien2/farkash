import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Heart, Zap, Trophy, Target, ShieldCheck } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { Card, ProgressBar } from '@/components/ui';
import { t, tArr } from '@/utils/i18n';
import { reportStats } from '@/utils/report';
import { GAMES } from '@/types';

export function Report() {
  const { sessions, settings } = useApp();
  const lang = settings.lang;
  const dayLabels = useMemo(() => tArr(lang, 'day_labels'), [lang]);

  const stats = useMemo(() => reportStats(sessions, dayLabels), [sessions, dayLabels]);

  const maxDayScore = Math.max(1, ...stats.perDay.map((d) => d.score));
  const maxReaction = Math.max(1, ...stats.perDay.map((d) => d.reaction || 1));

  return (
    <div className="content-page">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-7 h-7 text-mango-600" />
        <h1 className="text-2xl font-black text-nile-800">{t(lang, 'report_title')}</h1>
      </div>
      <p className="text-sm font-semibold text-nile-500 mb-6">{t(lang, 'report_subtitle')}</p>
      {sessions.some((session) => session.id.startsWith('seed-')) && <p className="rounded-2xl border border-mango-200 bg-mango-50 text-nile-900 p-4 mb-5 text-sm leading-relaxed">{lang === 'ar' ? 'التقرير فيه بيانات تجريبية للتوضيح، مع أي جلسات لعب جديدة. البيانات محفوظة على جهازك.' : 'This report includes sample history alongside any new play sessions. Your history is saved on this device.'}</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          color="nile"
          label={t(lang, 'avg_reaction')}
          value={`${stats.avgReaction}`}
          unit={t(lang, 'ms_short')}
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          color="mint"
          label={t(lang, 'total_patience')}
          value={`${stats.totalPatience}`}
          unit={t(lang, 'seconds_unit')}
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          color="clay"
          label={t(lang, 'impulsive_errors')}
          value={`${stats.totalErrors}`}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          color="mango"
          label={t(lang, 'sessions_count')}
          value={`${stats.sessionsCount}`}
        />
      </div>

      {/* Impulse control + patience summary */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-mint-600" />
          <h3 className="font-black text-nile-800">{t(lang, 'impulse_control')}</h3>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl font-black text-mint-600">{stats.impulseControl}%</span>
          <div className="flex-1">
            <ProgressBar value={stats.impulseControl / 100} color="mint" />
          </div>
        </div>
        <p className="text-xs font-semibold text-nile-400 mb-3">{t(lang, 'impulse_control_hint')}</p>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-clay-500" />
          <span className="text-sm font-bold text-nile-600">{t(lang, 'total_patience')}:</span>
          <span className="text-sm font-black text-nile-800">
            {stats.totalPatience} {t(lang, 'seconds_unit')}
          </span>
        </div>
      </Card>

      {/* Daily score chart */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-nile-500" />
          <h3 className="font-black text-nile-800">{t(lang, 'best_score')}</h3>
        </div>
        <div className="flex items-stretch justify-between gap-2 h-32">
          {stats.perDay.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <motion.div
                className="w-full bg-gradient-to-t from-nile-500 to-nile-300 rounded-t-lg"
                initial={{ height: 0 }}
                animate={{ height: `${(d.score / maxDayScore) * 70}%` }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}
                style={{ minHeight: 4 }}
              />
              <span className="text-xs font-bold text-nile-600">{d.label}</span>
              <span className="text-xs font-black text-nile-800">{d.score}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Reaction time chart (lower is better) */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-mint-600" />
          <h3 className="font-black text-nile-800">{t(lang, 'avg_reaction')}</h3>
        </div>
        <div className="flex items-stretch justify-between gap-2 h-28">
          {stats.perDay.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <motion.div
                className="w-full bg-mint-500 rounded-t-lg"
                initial={{ height: 0 }}
                animate={{ height: d.count && d.reaction > 0 ? `${((maxReaction - d.reaction) / maxReaction) * 60 + 8}%` : '0%' }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}
                style={{ minHeight: 4 }}
              />
              <span className="text-xs font-bold text-nile-600">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-nile-400 font-semibold mt-2 text-center">
          {lang === 'ar' ? 'كل ما القايمه طالت، سرعة استجابتك أحسن' : 'Taller bars = faster reaction'}
        </p>
      </Card>

      {/* Per-game mastery */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-berry-500" />
          <h3 className="font-black text-nile-800">{t(lang, 'skill_mastery')}</h3>
        </div>
        <div className="space-y-2.5">
          {stats.perGame.map((pg) => {
            const meta = GAMES.find((g) => g.id === pg.game)!;
            const name = lang === 'ar' ? meta.ar.name : meta.en.name;
            return (
              <div key={pg.game} className="flex items-center gap-3">
                <span className="text-sm font-bold text-nile-700 w-28 truncate">{name}</span>
                <div className="flex-1 h-3 rounded-full bg-sand-200 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-l from-berry-500 to-nile-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${pg.avgScore}%` }}
                    transition={{ type: 'spring', stiffness: 120 }}
                  />
                </div>
                <span className="text-xs font-black text-nile-800 w-8 text-end">{pg.avgScore}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: 'nile' | 'mango' | 'clay' | 'mint' | 'berry';
}) {
  const colors: Record<string, string> = {
    nile: 'bg-nile-100 text-nile-700',
    mango: 'bg-mango-100 text-mango-800',
    clay: 'bg-clay-100 text-clay-700',
    mint: 'bg-mint-500/15 text-mint-600',
    berry: 'bg-berry-500/15 text-berry-500',
  };
  return (
    <Card className="p-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-nile-500 leading-tight mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-nile-800">{value}</span>
        {unit && <span className="text-xs font-bold text-nile-400">{unit}</span>}
      </div>
    </Card>
  );
}
