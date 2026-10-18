import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Check } from 'lucide-react';
import { GameArtwork } from '@/components/BrandArtwork';
import { GameShell, ResultScreen } from '@/components/GameShell';
import { Button } from '@/components/ui';
import { useRecordSession } from '@/hooks/useRecordSession';
import { useApp } from '@/store/useApp';
import { GAMES, type Lang } from '@/types';
import { t } from '@/utils/i18n';
import {
  startMusic,
  stopMusic,
  stopMusicWithFarkash,
  unlockAudio,
  playDing,
} from '@/utils/egyptianAudioEngine';
import { speak } from '@/utils/speech';
import { HeronPose, NileBoatPose } from '@/components/Illustrations';
import { POSE_ARTWORK } from '@/brand';

interface Props {
  onExit: () => void;
}

type Phase = 'setup' | 'playing' | 'frozen' | 'result';

interface Pose {
  key: string;
  arName: string;
  enName: string;
  color: string;
  artwork: ReactNode;
}

const POSES: Pose[] = [
  {
    key: 'sphinx',
    arName: 'اثبت زي أبو الهول',
    enName: 'Freeze like the Sphinx',
    color: '#FFC107',
    artwork: <img src={POSE_ARTWORK.sphinx} alt="" width="1122" height="1402" className="pose-artwork" decoding="async" />,
  },
  {
    key: 'juice',
    arName: 'اثبت زي بياع العرقسوس',
    enName: 'Freeze like the juice seller',
    color: '#D84315',
    artwork: <img src={POSE_ARTWORK.juice} alt="" width="1122" height="1402" className="pose-artwork" decoding="async" />,
  },
  {
    key: 'heron',
    arName: 'اقف على رجل واحدة زي مالك الحزين',
    enName: 'Stand on one leg like the heron',
    color: '#1E88E5',
    artwork: <HeronPose className="pose-artwork" />,
  },
  {
    key: 'ramses',
    arName: 'اثبت زي تمثال رمسيس',
    enName: 'Freeze like Ramses statue',
    color: '#FFB300',
    artwork: <img src={POSE_ARTWORK.ramses} alt="" width="1122" height="1402" className="pose-artwork" decoding="async" />,
  },
  {
    key: 'boat',
    arName: 'اثبت زي المركب في النيل',
    enName: 'Freeze like a Nile boat',
    color: '#26A69A',
    artwork: <NileBoatPose className="pose-artwork" />,
  },
];

export function TamathilGame({ onExit }: Props) {
  const { settings } = useApp();
  const lang = settings.lang;
  const game = GAMES.find((g) => g.id === 'tamathil')!;

  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);
  const [currentPose, setCurrentPose] = useState<Pose>(POSES[0]);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [heldSeconds, setHeldSeconds] = useState(0);
  const [freezeConfirmed, setFreezeConfirmed] = useState(false);
  const [totalHeld, setTotalHeld] = useState(0);

  const stopTimeRef = useRef<number>(0);
  const stopTimerRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (stopTimerRef.current !== null) clearTimeout(stopTimerRef.current);
    if (holdTimerRef.current !== null) clearInterval(holdTimerRef.current);
    stopTimerRef.current = null;
    holdTimerRef.current = null;
  };

  useEffect(() => () => clearTimers(), []);

  const showPose = () => {
    stopMusicWithFarkash();
    const pose = POSES[Math.floor(Math.random() * POSES.length)];
    setCurrentPose(pose);
    setPhase('frozen');
    setHeldSeconds(0);
    setFreezeConfirmed(false);
    stopTimeRef.current = Date.now();
    if (settings.speech) speak(lang === 'ar' ? pose.arName : pose.enName);
  };

  const confirmFreeze = () => {
    if (freezeConfirmed) return;
    setFreezeConfirmed(true);
    setReactionTimes((times) => [...times, Date.now() - stopTimeRef.current]);
    holdTimerRef.current = window.setInterval(() => setHeldSeconds((seconds) => seconds + 1), 1000);
  };

  const startRound = () => {
    unlockAudio();
    setPhase('playing');
    startMusic();
    if (settings.speech) speak(lang === 'ar' ? 'اجري والعب!' : 'Run and play!');
    stopTimerRef.current = window.setTimeout(showPose, (4 + Math.random() * 8) * 1000);
  };

  const markHeld = () => {
    clearTimers();
    setTotalHeld((p) => p + heldSeconds);
    playDing(true);
    if (round >= totalRounds) {
      finishGame();
    } else {
      setRound((r) => r + 1);
      setPhase('setup');
    }
  };

  const finishGame = () => {
    setPhase('result');
    stopMusic();
  };

  const handleExit = () => {
    stopMusic();
    clearTimers();
    onExit();
  };

  const handleRestart = () => {
    clearTimers();
    stopMusic();
    setPhase('setup');
    setRound(1);
    setReactionTimes([]);
    setHeldSeconds(0);
    setTotalHeld(0);
  };

  const buildResult = () => {
    const avg = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 600;
    const score = Math.max(25, Math.min(100, 100 - Math.round((avg - 150) / 10) + totalHeld));
    return {
      game: 'tamathil' as const,
      reactionMs: avg,
      patienceSec: totalHeld,
      impulsiveErrors: Math.max(0, reactionTimes.filter((r) => r > 1000).length),
      score,
    };
  };

  const session = buildResult();
  useRecordSession(phase === 'result', session);

  return (
    <GameShell game={game} lang={lang} onExit={handleExit} onRestart={handleRestart} headerColor="#D84315">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" className="flex-1 px-5 py-6 flex flex-col" exit={{ opacity: 0 }}>
            <div className="text-center">
              <p className="font-black text-nile-700 text-lg">
                {lang === 'ar' ? `الجولة ${round} من ${totalRounds}` : `Round ${round} of ${totalRounds}`}
              </p>
              <p className="text-sm font-semibold text-nile-500 mt-2 max-w-xs mx-auto">
                {lang === 'ar'
                  ? 'لما الموسيقى تقف فجأة، اعمل الوضعية اللي تظهر على الشاشة واثبت فيها'
                  : 'When the music suddenly stops, hold the pose shown on screen'}
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <GameArtwork game="tamathil" className="setup-artwork" />
            </div>
            <Button variant="clay" size="xl" onClick={startRound} className="w-full">
              <span className="flex items-center justify-center gap-2">
                <Play className="w-6 h-6" />
                {t(lang, 'start')}
              </span>
            </Button>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div key="playing" className="flex-1 flex flex-col items-center justify-center px-5" exit={{ opacity: 0 }}>
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-clay-400/40"
                animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="w-52 h-52 rounded-full bg-clay-500 flex items-center justify-center shadow-pop"
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <span className="text-5xl font-black text-white">{t(lang, 'run_play')}</span>
              </motion.div>
            </div>
            <p className="text-center font-black text-lg text-nile-600 mt-8">
              {t(lang, 'music_playing')}
            </p>
            <Button variant="ghost" size="md" className="mt-4" onClick={() => {
              clearTimers();
              showPose();
            }}>
              <span className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                {t(lang, 'stop')}
              </span>
            </Button>
          </motion.div>
        )}

        {phase === 'frozen' && (
          <motion.div
            key="frozen"
            className="relative flex-1 flex flex-col items-center justify-center px-5"
            initial={{ backgroundColor: currentPose.color }}
            animate={{ backgroundColor: '#F5F0E1' }}
            transition={{ duration: 0.4 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ backgroundColor: currentPose.color }}
            />
            <motion.div
              initial={{ scale: 0.4, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              className="relative z-10 mb-4 w-full flex justify-center"
              aria-hidden="true"
            >
              {currentPose.artwork}
            </motion.div>
            <motion.h2
              className="relative z-10 text-3xl font-black text-nile-800 text-center mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {lang === 'ar' ? currentPose.arName : currentPose.enName}
            </motion.h2>
            <p className="relative z-10 font-bold text-nile-600 mb-6">
              {t(lang, 'hold_pose')} · {heldSeconds}s
            </p>
            <Button variant="mint" size="lg" className="relative z-10" onClick={freezeConfirmed ? markHeld : confirmFreeze}>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {freezeConfirmed ? t(lang, 'correct') : lang === 'ar' ? 'ثبتّ! ابدأ العد' : 'I’m frozen! Start the timer'}
              </span>
            </Button>
          </motion.div>
        )}

        {phase === 'result' && (
          <ResultScreen
            key="result"
            lang={lang}
            score={session.score}
            reactionMs={reactionTimes.length ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0}
            patienceSec={totalHeld}
            errors={reactionTimes.filter((r) => r > 1000).length}
            onPlayAgain={handleRestart}
            onExit={handleExit}
          />
        )}
      </AnimatePresence>
    </GameShell>
  );
}

// re-export Lang type to satisfy import usage
export type { Lang };
