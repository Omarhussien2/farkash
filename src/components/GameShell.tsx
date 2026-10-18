import { useEffect } from 'react';
import { stopMusic } from '@/utils/egyptianAudioEngine';
import { stopSpeaking } from '@/utils/speech';
import { motion } from 'framer-motion';
import { X, RotateCcw, Trophy, Medal, Award } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import type { GameMeta, Lang } from '@/types';
import { t } from '@/utils/i18n';

interface Props {
  game: GameMeta;
  lang: Lang;
  onExit: () => void;
  onRestart?: () => void;
  children: ReactNode;
  headerColor?: string;
}

export function GameShell({ game, lang, onExit, onRestart, children, headerColor }: Props) {
  const meta = lang === 'ar' ? game.ar : game.en;
  useEffect(() => () => { stopMusic(); stopSpeaking(); }, []);
  return (
    <div className="game-shell bg-sand-100 flex flex-col">
      <div
        className="game-header px-4 pb-4 rounded-b-3xl"
        style={{ backgroundColor: headerColor ?? '#1565C0', color: headerColor === '#FFC107' ? '#142d50' : 'white' }}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { stopMusic(); stopSpeaking(); onExit(); }}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center"
            aria-label={t(lang, 'exit_game')}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-black leading-tight">{meta.name}</h1>
            <p className="text-xs font-semibold opacity-90">{meta.skill}</p>
          </div>
          {onRestart ? (
            <button
              onClick={() => { stopMusic(); stopSpeaking(); onRestart(); }}
              className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center"
              aria-label={t(lang, 'reset')}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-11 h-11" />
          )}
        </div>
      </div>
      <motion.div
        className="flex-1 flex flex-col"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface ResultScreenProps {
  lang: Lang;
  score: number;
  onPlayAgain: () => void;
  onExit: () => void;
  reactionMs?: number;
  patienceSec?: number;
  errors?: number;
}

export function ResultScreen({
  lang,
  score,
  onPlayAgain,
  onExit,
  reactionMs,
  patienceSec,
  errors,
}: ResultScreenProps) {
  const MedalIcon = score >= 80 ? Trophy : score >= 60 ? Medal : Award;
  const medalColor =
    score >= 80 ? 'text-mango-600' : score >= 60 ? 'text-nile-500' : 'text-clay-500';
  const medalText =
    score >= 80
      ? lang === 'ar'
        ? 'بطل!'
        : 'Champion!'
      : score >= 60
      ? lang === 'ar'
        ? 'كويس قوي'
        : 'Great'
      : lang === 'ar'
      ? 'يلا تاني'
      : 'Try again';
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className={`mb-2 ${medalColor}`}
      >
        <MedalIcon className="w-20 h-20" strokeWidth={2} />
      </motion.div>
      <h2 className="text-3xl font-black text-nile-800 mb-1">{medalText}</h2>
      <p className="text-sm font-bold text-nile-500 mb-4">{t(lang, 'final_score')}</p>
      <div className="text-6xl font-black text-mango-600 mb-6">{score}</div>
      {(reactionMs !== undefined || patienceSec !== undefined || errors !== undefined) && (
        <div className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs">
          {reactionMs !== undefined && (
            <div className="bg-white rounded-2xl p-3 shadow-card">
              <p className="text-xs font-bold text-nile-500">{t(lang, 'avg_reaction')}</p>
              <p className="text-lg font-black text-nile-800">{reactionMs}</p>
              <p className="text-xs text-nile-400">{t(lang, 'ms_short')}</p>
            </div>
          )}
          {patienceSec !== undefined && (
            <div className="bg-white rounded-2xl p-3 shadow-card">
              <p className="text-xs font-bold text-nile-500">{t(lang, 'total_patience')}</p>
              <p className="text-lg font-black text-mint-600">{patienceSec}</p>
              <p className="text-xs text-nile-400">{t(lang, 'seconds_unit')}</p>
            </div>
          )}
          {errors !== undefined && (
            <div className="bg-white rounded-2xl p-3 shadow-card">
              <p className="text-xs font-bold text-nile-500">{t(lang, 'impulsive_errors')}</p>
              <p className="text-lg font-black text-clay-600">{errors}</p>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button variant="mango" size="lg" onClick={onPlayAgain}>
          {t(lang, 'play_again')}
        </Button>
        <Button variant="ghost" size="md" onClick={onExit}>
          {t(lang, 'exit_game')}
        </Button>
      </div>
    </div>
  );
}
