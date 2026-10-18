import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Check, X } from 'lucide-react';
import { GameArtwork } from '@/components/BrandArtwork';
import { GameShell, ResultScreen } from '@/components/GameShell';
import { Button } from '@/components/ui';
import { useRecordSession } from '@/hooks/useRecordSession';
import { useApp } from '@/store/useApp';
import { GAMES, type Lang } from '@/types';
import { t } from '@/utils/i18n';
import { unlockAudio, playDing, playPop, playWhistle } from '@/utils/egyptianAudioEngine';
import { speak } from '@/utils/speech';

interface Props {
  onExit: () => void;
}

type Light = 'green' | 'yellow' | 'red';
type Phase = 'setup' | 'playing' | 'result';

interface Trial {
  light: Light;
  sultanSaid: boolean; // true = "Sultan says" (must obey), false = "didn't say" (must freeze)
}

const LIGHT_META: Record<Light, { color: string; ar: string; en: string }> = {
  green: { color: '#2E7D32', ar: 'إشارة خضرا… اجري', en: 'Green light… run' },
  yellow: { color: '#FFC107', ar: 'إشارة صفرا… بالراحة', en: 'Yellow light… slow' },
  red: { color: '#D84315', ar: 'إشارة حمرا… اقف', en: 'Red light… stop' },
};

function makeTrial(): Trial {
  const lights: Light[] = ['green', 'yellow', 'red'];
  const light = lights[Math.floor(Math.random() * lights.length)];
  // ~30% of trials are "didn't say" (must freeze regardless)
  const sultanSaid = Math.random() > 0.3;
  return { light, sultanSaid };
}

// Interactive red/yellow/green traffic light SVG (hierarchy: red top, yellow mid, green bottom)
const LAMP_ORDER: Light[] = ['red', 'yellow', 'green'];
const LAMP_CY: Record<Light, number> = { red: 44, yellow: 88, green: 132 };

function TrafficLightSvg({ active, className }: { active: Light | null; className?: string }) {
  return (
    <svg viewBox="0 0 88 176" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="76" height="164" rx="18" fill="#37474F" />
      <rect x="12" y="12" width="64" height="152" rx="14" fill="#263238" />
      {LAMP_ORDER.map((l) => {
        const on = active === l;
        return (
          <g key={l}>
            {on && (
              <circle cx="44" cy={LAMP_CY[l]} r="30" fill={LIGHT_META[l].color} opacity={0.25} />
            )}
            <motion.circle
              cx="44"
              cy={LAMP_CY[l]}
              r="22"
              fill={on ? LIGHT_META[l].color : '#546E7A'}
              animate={{ opacity: on ? [0.75, 1, 0.75] : 0.3 }}
              transition={{ duration: 0.9, repeat: on ? Infinity : 0 }}
            />
            <circle cx="44" cy={LAMP_CY[l]} r="22" stroke="#1B262C" strokeWidth="3" />
          </g>
        );
      })}
    </svg>
  );
}

export function IsharaGame({ onExit }: Props) {
  const { settings } = useApp();
  const lang = settings.lang;
  const game = GAMES.find((g) => g.id === 'ishara')!;

  const [phase, setPhase] = useState<Phase>('setup');
  const [trialIdx, setTrialIdx] = useState(0);
  const [trial, setTrial] = useState<Trial>({ light: 'green', sultanSaid: true });
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState<null | boolean>(null);
  const totalTrials = 10;

  const trialStartRef = useRef<number>(0);
  const advanceTimerRef = useRef<number | null>(null);

  const clearAdvance = () => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => () => clearAdvance(), []);

  const startGame = () => {
    unlockAudio();
    setPhase('playing');
    setTrialIdx(0);
    setScore(0);
    setErrors(0);
    setReactionTimes([]);
    nextTrial(0);
  };

  const nextTrial = (idx: number) => {
    if (idx >= totalTrials) {
      setPhase('result');
      return;
    }
    const tr = makeTrial();
    setTrial(tr);
    setTrialIdx(idx);
    setShowFeedback(null);
    trialStartRef.current = Date.now();
    if (settings.speech) {
      const msg = tr.sultanSaid
        ? lang === 'ar'
          ? `قال السلطان: ${LIGHT_META[tr.light].ar}`
          : `Sultan says: ${LIGHT_META[tr.light].en}`
        : lang === 'ar'
        ? 'مقالش السلطان! اثبت'
        : "He didn't say! Freeze";
      speak(msg);
    }
  };

  const answer = (action: 'run' | 'slow' | 'freeze') => {
    if (showFeedback !== null) return;
    clearAdvance();
    const rt = Date.now() - trialStartRef.current;
    setReactionTimes((p) => [...p, rt]);
    // Correct logic:
    // If sultanSaid: obey light (green=run, yellow=slow, red=freeze)
    // If NOT sultanSaid: must freeze regardless
    const correctAction = trial.sultanSaid
      ? trial.light === 'green'
        ? 'run'
        : trial.light === 'yellow'
        ? 'slow'
        : 'freeze'
      : 'freeze';
    const isCorrect = action === correctAction;
    if (isCorrect) {
      setScore((s) => s + 10);
      playDing(true);
    } else {
      setErrors((e) => e + 1);
      playWhistle();
    }
    setShowFeedback(isCorrect);
    advanceTimerRef.current = window.setTimeout(() => {
      nextTrial(trialIdx + 1);
    }, 900);
  };

  const handleExit = () => {
    clearAdvance();
    onExit();
  };

  const handleRestart = () => {
    clearAdvance();
    setPhase('setup');
    setScore(0);
    setErrors(0);
    setReactionTimes([]);
  };

  const buildResult = () => {
    const avg = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 800;
    const finalScore = Math.max(20, Math.min(100, score - errors * 3));
    return {
      game: 'ishara' as const,
      reactionMs: avg,
      patienceSec: Math.round(score / 5),
      impulsiveErrors: errors,
      score: finalScore,
    };
  };

  const meta = LIGHT_META[trial.light];

  const session = buildResult();
  useRecordSession(phase === 'result', session);

  return (
    <GameShell game={game} lang={lang} onExit={handleExit} onRestart={handleRestart} headerColor="#FFC107">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" className="flex-1 px-5 py-6 flex flex-col" exit={{ opacity: 0 }}>
            <div className="text-center mb-6">
              <p className="font-black text-nile-700 text-lg">
                {lang === 'ar' ? `${totalTrials} إشارات متتالية` : `${totalTrials} signals in a row`}
              </p>
              <p className="text-sm font-semibold text-nile-500 mt-3 max-w-xs mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'لما السلطان يقول «قال السلطان»، اعمل حسب اللون: أخضر=اجري، أصفر=ببطء، أحمر=اقف. لو مقلش «قال السلطان»، اثبت على طول!'
                  : 'When you hear "Sultan says", follow the light: green=run, yellow=slow, red=freeze. If he doesn\'t say it, freeze immediately!'}
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center gap-4">
              <GameArtwork game="ishara" className="setup-artwork" />
            </div>
            <Button variant="mango" size="xl" onClick={startGame} className="w-full">
              <span className="flex items-center justify-center gap-2">
                <Play className="w-6 h-6" />
                {t(lang, 'start')}
              </span>
            </Button>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div key="playing" className="flex-1 flex flex-col px-5 py-4" exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-nile-700">
                {lang === 'ar' ? `إشارة ${trialIdx + 1} / ${totalTrials}` : `Signal ${trialIdx + 1} / ${totalTrials}`}
              </span>
              <span className="font-black text-mango-700">{t(lang, 'score')}: {score}</span>
            </div>

            {/* Sultan banner */}
            <div
              className={`rounded-2xl p-3 mb-4 text-center font-black ${
                trial.sultanSaid ? 'bg-mint-500/15 text-mint-600' : 'bg-clay-500/15 text-clay-600'
              }`}
            >
              {trial.sultanSaid ? t(lang, 'sultan_says') : t(lang, 'did_not_say')}
            </div>

            {/* Traffic light + big cue */}
            <motion.div
              className="flex-1 flex items-center justify-center gap-6"
              key={`${trialIdx}-${trial.light}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            >
              <TrafficLightSvg active={trial.light} className="w-20 sm:w-24 shrink-0" />
              <div
                className="w-44 h-44 rounded-full shadow-pop flex items-center justify-center text-center px-5"
                style={{ backgroundColor: meta.color }}
              >
                <span className={`text-xl font-black leading-tight ${trial.light === 'yellow' ? 'text-nile-900' : 'text-white'}`}>
                  {lang === 'ar' ? meta.ar : meta.en}
                </span>
              </div>
            </motion.div>

            {/* Answer buttons */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button
                disabled={showFeedback !== null}
                variant="mint"
                size="md"
                onClick={() => {
                  playPop();
                  answer('run');
                }}
              >
                {t(lang, 'reverse_run')}
              </Button>
              <Button
                disabled={showFeedback !== null}
                variant="mango"
                size="md"
                onClick={() => {
                  playPop();
                  answer('slow');
                }}
              >
                {lang === 'ar' ? 'ببطء' : 'Slow'}
              </Button>
              <Button
                disabled={showFeedback !== null}
                variant="clay"
                size="md"
                onClick={() => {
                  playPop();
                  answer('freeze');
                }}
              >
                {t(lang, 'reverse_freeze')}
              </Button>
            </div>

            <AnimatePresence>
              {showFeedback !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`fixed inset-x-0 bottom-24 mx-auto max-w-xs rounded-2xl p-4 text-center font-black ${
                    showFeedback ? 'bg-mint-500 text-white' : 'bg-clay-500 text-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {showFeedback ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {showFeedback ? t(lang, 'correct') : t(lang, 'wrong')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'result' && (
          <ResultScreen
            key="result"
            lang={lang}
            score={session.score}
            reactionMs={reactionTimes.length ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0}
            patienceSec={Math.round(score / 5)}
            errors={errors}
            onPlayAgain={handleRestart}
            onExit={handleExit}
          />
        )}
      </AnimatePresence>
    </GameShell>
  );
}

export type { Lang };
