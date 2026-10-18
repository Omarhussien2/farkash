import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { GameArtwork } from '@/components/BrandArtwork';
import { GameShell, ResultScreen } from '@/components/GameShell';
import { Button } from '@/components/ui';
import { useRecordSession } from '@/hooks/useRecordSession';
import { useApp } from '@/store/useApp';
import { GAMES, type Lang } from '@/types';
import { t } from '@/utils/i18n';
import { unlockAudio, playWhoosh, playDing } from '@/utils/egyptianAudioEngine';
import { speak } from '@/utils/speech';

interface Props {
  onExit: () => void;
}

type Phase = 'setup' | 'breathing' | 'result';
type BreathStage = 'inhale' | 'hold' | 'exhale' | 'rest';

const INHALE_SEC = 4;
const HOLD_SEC = 2;
const EXHALE_SEC = 6;
const REST_SEC = 1;
const TOTAL_ROUNDS = 4;

export function NafasGame({ onExit }: Props) {
  const { settings } = useApp();
  const lang = settings.lang;
  const game = GAMES.find((g) => g.id === 'nafas')!;

  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(1);
  const [stage, setStage] = useState<BreathStage>('inhale');
  const [stageProgress, setStageProgress] = useState(0); // 0..1
  const [completedRounds, setCompletedRounds] = useState(0);
  const completedRoundsRef = useRef(0);
  const [totalHeld, setTotalHeld] = useState(0);

  const timerRef = useRef<number | null>(null);
  const stageStartRef = useRef<number>(0);
  const stageDurRef = useRef<number>(INHALE_SEC * 1000);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const runStage = useCallback(
    (st: BreathStage) => {
      setStage(st);
      stageStartRef.current = Date.now();
      const dur =
        st === 'inhale'
          ? INHALE_SEC * 1000
          : st === 'hold'
          ? HOLD_SEC * 1000
          : st === 'exhale'
          ? EXHALE_SEC * 1000
          : REST_SEC * 1000;
      stageDurRef.current = dur;
      setStageProgress(0);
      if (st === 'inhale') {
        playWhoosh(true);
        if (settings.speech) speak(lang === 'ar' ? 'خد نفس عميق بالراحة' : 'Inhale slowly', { rate: 0.7 });
      } else if (st === 'exhale') {
        playWhoosh(false);
        if (settings.speech) speak(lang === 'ar' ? 'طلع الهوا بشويش' : 'Exhale', { rate: 0.7 });
      } else if (st === 'hold' && settings.speech) {
        speak(lang === 'ar' ? 'احبس النفس ثانية' : 'Hold', { rate: 0.8 });
      }
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - stageStartRef.current;
        const p = Math.min(1, elapsed / stageDurRef.current);
        setStageProgress(p);
        if (p >= 1) {
          clearTimer();
          // Advance to next stage
          const next: BreathStage =
            st === 'inhale' ? 'hold' : st === 'hold' ? 'exhale' : st === 'exhale' ? 'rest' : 'inhale';
          if (st === 'exhale') {
            setTotalHeld((h) => h + INHALE_SEC + HOLD_SEC + EXHALE_SEC);
          }
          if (st === 'rest') {
            // completed a round
            const newRounds = completedRoundsRef.current + 1;
            completedRoundsRef.current = newRounds;
            setCompletedRounds(newRounds);
            if (newRounds >= TOTAL_ROUNDS) {
              setPhase('result');
              playDing(true);
              return;
            }
            setRound(newRounds + 1);
          }
          runStage(next);
        }
      }, 60);
    },
    [lang, settings.speech]
  );

  const startGame = () => {
    unlockAudio();
    setPhase('breathing');
    setRound(1);
    setCompletedRounds(0);
    completedRoundsRef.current = 0;
    setTotalHeld(0);
    runStage('inhale');
  };

  const handleExit = () => {
    clearTimer();
    onExit();
  };

  const handleRestart = () => {
    clearTimer();
    setPhase('setup');
    setRound(1);
    setCompletedRounds(0);
    completedRoundsRef.current = 0;
    setTotalHeld(0);
    setStage('inhale');
    setStageProgress(0);
  };

  const buildResult = () => {
    const score = Math.min(100, 40 + completedRounds * 15);
    return {
      game: 'nafas' as const,
      reactionMs: 0,
      patienceSec: totalHeld,
      impulsiveErrors: 0,
      score,
    };
  };

  const stageLabel =
    stage === 'inhale'
      ? t(lang, 'inhale')
      : stage === 'hold'
      ? t(lang, 'hold')
      : stage === 'exhale'
      ? t(lang, 'exhale')
      : lang === 'ar'
      ? 'استريح'
      : 'Rest';

  const stageDurationLabel =
    stage === 'inhale'
      ? t(lang, 'inhale_for')
      : stage === 'hold'
      ? t(lang, 'hold_for')
      : stage === 'exhale'
      ? t(lang, 'exhale_for')
      : '';

  // turtle scale: inhale grows 1 -> 1.25, exhale shrinks 1.25 -> 0.9, etc.
  const turtleScale =
    stage === 'inhale'
      ? 1 + stageProgress * 0.3
      : stage === 'hold'
      ? 1.3
      : stage === 'exhale'
      ? 1.3 - stageProgress * 0.4
      : 0.9;

  const stageColor =
    stage === 'inhale' ? '#1E88E5' : stage === 'hold' ? '#FFC107' : stage === 'exhale' ? '#26A69A' : '#A89866';

  const session = buildResult();
  useRecordSession(phase === 'result', session);

  return (
    <GameShell game={game} lang={lang} onExit={handleExit} onRestart={handleRestart} headerColor="#00897B">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" className="flex-1 px-5 py-6 flex flex-col" exit={{ opacity: 0 }}>
            <div className="text-center mb-6">
              <p className="font-black text-mint-600 text-lg">{t(lang, 'calm_down')}</p>
              <p className="text-sm font-semibold text-nile-500 mt-3 max-w-xs mx-auto leading-relaxed">
                {lang === 'ar'
                  ? `تابع السلحفاة: شُم هوا ٤ ثواني، اثبت ٢ ثانية، طلع هوا ٦ ثواني. كرر ${TOTAL_ROUNDS} مرات وهدّي نفسك.`
                  : `Follow the turtle: inhale 4s, hold 2s, exhale 6s. Repeat ${TOTAL_ROUNDS} times to calm down.`}
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <GameArtwork game="nafas" className="setup-artwork" />
              </motion.div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
              <div className="bg-nile-100 rounded-2xl p-3">
                <p className="text-xs font-bold text-nile-600">{t(lang, 'inhale_for')}</p>
              </div>
              <div className="bg-mango-100 rounded-2xl p-3">
                <p className="text-xs font-bold text-mango-800">{t(lang, 'hold_for')}</p>
              </div>
              <div className="bg-mint-500/15 rounded-2xl p-3">
                <p className="text-xs font-bold text-mint-600">{t(lang, 'exhale_for')}</p>
              </div>
            </div>
            <Button variant="mint" size="xl" onClick={startGame} className="w-full">
              <span className="flex items-center justify-center gap-2">
                <Play className="w-6 h-6" />
                {t(lang, 'start')}
              </span>
            </Button>
          </motion.div>
        )}

        {phase === 'breathing' && (
          <motion.div
            key="breathing"
            className="flex-1 flex flex-col items-center justify-center px-5 bg-mint-500/10"
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-6">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < completedRounds ? 'bg-mint-600' : 'bg-sand-300'}`}
                />
              ))}
            </div>

            <motion.div
              className="flex items-center justify-center mb-8"
              animate={{ scale: turtleScale }}
              transition={{ duration: 0.1 }}
            >
              <GameArtwork game="nafas" className="setup-artwork" />
            </motion.div>

            <motion.div
              key={stage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center mb-4"
            >
              <p className="text-4xl font-black" style={{ color: stageColor }}>
                {stageLabel}
              </p>
              {stageDurationLabel && (
                <p className="text-sm font-bold text-nile-500 mt-1">{stageDurationLabel}</p>
              )}
            </motion.div>

            <div className="w-full max-w-xs h-3 rounded-full bg-sand-200 overflow-hidden mb-6">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: stageColor }}
                animate={{ width: `${stageProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <p className="text-sm font-bold text-nile-500">
              {lang === 'ar' ? `جولة ${round} من ${TOTAL_ROUNDS}` : `Round ${round} of ${TOTAL_ROUNDS}`}
            </p>
          </motion.div>
        )}

        {phase === 'result' && (
          <ResultScreen
            key="result"
            lang={lang}
            score={session.score}
            patienceSec={totalHeld}
            onPlayAgain={handleRestart}
            onExit={handleExit}
          />
        )}
      </AnimatePresence>
    </GameShell>
  );
}

export type { Lang };
