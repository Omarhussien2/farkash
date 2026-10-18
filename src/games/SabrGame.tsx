import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Battery, AlertTriangle } from 'lucide-react';
import { GameArtwork } from '@/components/BrandArtwork';
import { GameShell, ResultScreen } from '@/components/GameShell';
import { Button, ProgressBar } from '@/components/ui';
import { useRecordSession } from '@/hooks/useRecordSession';
import { useApp } from '@/store/useApp';
import { GAMES, type Lang } from '@/types';
import { t } from '@/utils/i18n';
import { unlockAudio, playDing, playWhistle } from '@/utils/egyptianAudioEngine';
import { speak } from '@/utils/speech';

interface Props {
  onExit: () => void;
}

type Phase = 'setup' | 'charging' | 'tapWindow' | 'result';
type LightColor = 'green' | 'trap' | 'off';

const TOTAL_ROUNDS = 5;

export function SabrGame({ onExit }: Props) {
  const { settings } = useApp();
  const lang = settings.lang;
  const game = GAMES.find((g) => g.id === 'sabr')!;

  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(1);
  const [charge, setCharge] = useState(0); // 0..1
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [patienceSec, setPatienceSec] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentLight, setCurrentLight] = useState<LightColor>('off');

  const chargeStartRef = useRef<number>(0);
  const chargeTimerRef = useRef<number | null>(null);
  const tapWindowRef = useRef<number>(0); // when green appeared
  const lightTimerRef = useRef<number | null>(null);

  const clearAll = () => {
    if (chargeTimerRef.current !== null) clearInterval(chargeTimerRef.current);
    if (lightTimerRef.current !== null) clearTimeout(lightTimerRef.current);
    chargeTimerRef.current = null;
    lightTimerRef.current = null;
  };

  useEffect(() => () => clearAll(), []);

  const startRound = () => {
    unlockAudio();
    setPhase('charging');
    setCharge(0);
    setCurrentLight('off');
    chargeStartRef.current = Date.now();
    // Charging duration 3-6s
    const duration = 3000 + Math.random() * 3000;
    const interval = 80;
    const steps = duration / interval;
    let step = 0;
    chargeTimerRef.current = window.setInterval(() => {
      step++;
      setCharge(Math.min(1, step / steps));
      if (step >= steps) {
        if (chargeTimerRef.current !== null) clearInterval(chargeTimerRef.current);
        chargeTimerRef.current = null;
        // Battery charged — now start cycling trap colors then green
        startLightCycle();
      }
    }, interval);
    if (settings.speech) speak(lang === 'ar' ? 'استنى ما البطارية تتشحن' : 'Wait for the battery to charge');
  };

  const startLightCycle = () => {
    setPhase('tapWindow');
    // Show a few trap colors, then green at random moment
    const trapCount = 2 + Math.floor(Math.random() * 3);
    let shown = 0;
    const showTrap = () => {
      setCurrentLight('trap');
      const trapDur = 600 + Math.random() * 600;
      lightTimerRef.current = window.setTimeout(() => {
        shown++;
        if (shown >= trapCount) {
          // Now green
          setCurrentLight('green');
          tapWindowRef.current = Date.now();
          if (settings.speech) speak(lang === 'ar' ? 'دلوقتي! دوس بسرعة' : 'Now! Tap');
        } else {
          setCurrentLight('off');
          lightTimerRef.current = window.setTimeout(showTrap, 300);
        }
      }, trapDur);
    };
    showTrap();
  };

  const handleTap = () => {
    if (phase === 'charging') {
      // Tapped too early during charging
      clearAll();
      setErrors((e) => e + 1);
      playWhistle();
      if (settings.speech) speak(lang === 'ar' ? 'متتسرعش! استنى الشحن' : "Don't rush! Wait for charge");
      // Restart same round
      setPhase('setup');
      return;
    }
    if (phase === 'tapWindow') {
      if (currentLight === 'green') {
        const rt = Date.now() - tapWindowRef.current;
        setReactionTimes((p) => [...p, rt]);
        const waitSec = Math.round((Date.now() - chargeStartRef.current) / 1000);
        setPatienceSec((p) => p + waitSec);
        setScore((s) => s + Math.max(5, 20 - Math.floor(rt / 100)));
        playDing(true);
        clearAll();
        nextRound();
      } else if (currentLight === 'trap') {
        // Tapped on a trap color — error
        setErrors((e) => e + 1);
        playWhistle();
        if (settings.speech) speak(lang === 'ar' ? 'حاسب ده فخ! متلمسش اللون ده' : 'Trap! Wrong color');
      }
    }
  };

  const nextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      setPhase('result');
    } else {
      setRound((r) => r + 1);
      setPhase('setup');
      setCharge(0);
      setCurrentLight('off');
    }
  };

  const handleExit = () => {
    clearAll();
    onExit();
  };

  const handleRestart = () => {
    clearAll();
    setPhase('setup');
    setRound(1);
    setScore(0);
    setErrors(0);
    setPatienceSec(0);
    setCharge(0);
    setCurrentLight('off');
    setReactionTimes([]);
  };

  const buildResult = () => {
    const avg = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 600;
    const finalScore = Math.max(15, Math.min(100, score - errors * 5));
    return {
      game: 'sabr' as const,
      reactionMs: avg,
      patienceSec,
      impulsiveErrors: errors,
      score: finalScore,
    };
  };

  const bg =
    currentLight === 'green'
      ? 'bg-mint-600'
      : currentLight === 'trap'
      ? 'bg-clay-500'
      : 'bg-nile-100';

  const session = buildResult();
  useRecordSession(phase === 'result', session);

  return (
    <GameShell game={game} lang={lang} onExit={handleExit} onRestart={handleRestart} headerColor="#1E88E5">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" className="flex-1 px-5 py-6 flex flex-col" exit={{ opacity: 0 }}>
            <div className="text-center mb-6">
              <p className="font-black text-nile-700 text-lg">
                {lang === 'ar' ? `جولة ${round} من ${TOTAL_ROUNDS}` : `Round ${round} of ${TOTAL_ROUNDS}`}
              </p>
              <p className="text-sm font-semibold text-nile-500 mt-3 max-w-xs mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'استنى ما بطارية الصبر تتشحن من غير ما تلمس الشاشة. وبعدين اضغط بس لما تشوف اللون الأخضر. تجاهل الألوان الخادعة!'
                  : 'Wait for the patience battery to charge without touching. Then tap ONLY when you see green. Ignore trap colors!'}
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <GameArtwork game="sabr" className="setup-artwork" />
            </div>
            <Button variant="primary" size="xl" onClick={startRound} className="w-full">
              <span className="flex items-center justify-center gap-2">
                <Play className="w-6 h-6" />
                {t(lang, 'start')}
              </span>
            </Button>
          </motion.div>
        )}

        {(phase === 'charging' || phase === 'tapWindow') && (
          <motion.div
            key="active"
            className={`flex-1 flex flex-col items-center justify-center px-5 transition-colors duration-300 ${bg}`}
            exit={{ opacity: 0 }}
          >
            {phase === 'charging' && (
              <>
                <motion.div
                  className="w-32 h-32 rounded-full bg-white flex items-center justify-center mb-6"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Battery className="w-16 h-16 text-nile-500" />
                </motion.div>
                <p className="text-nile-900 font-black text-xl text-center mb-2">{t(lang, 'patience_wait')}</p>
                <p className="text-nile-800 font-bold text-center mb-6">{t(lang, 'dont_touch')}</p>
                <div className="w-full max-w-xs">
                  <ProgressBar value={charge} color="mint" />
                </div>
              </>
            )}

            {phase === 'tapWindow' && (
              <>
                <motion.div
                  className="w-48 h-48 rounded-full bg-white shadow-pop flex items-center justify-center mb-6"
                  key={currentLight}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 250 }}
                >
                  {currentLight === 'green' && (
                    <span className="text-mint-600 text-5xl font-black">{t(lang, 'go')}</span>
                  )}
                  {currentLight === 'trap' && (
                    <AlertTriangle className="w-20 h-20 text-clay-600" />
                  )}
                  {currentLight === 'off' && (
                    <span className="text-nile-400 text-2xl font-black">…</span>
                  )}
                </motion.div>
                <p className="text-white font-black text-center text-lg">
                  {currentLight === 'green' ? t(lang, 'charged') : t(lang, 'tap_on_green')}
                </p>
              </>
            )}

            <Button
              variant={currentLight === 'green' ? 'mint' : 'ghost'}
              size="xl"
              className="mt-8"
              onClick={handleTap}
            >
              {phase === 'charging' ? t(lang, 'dont_touch') : t(lang, 'go')}
            </Button>
          </motion.div>
        )}

        {phase === 'result' && (
          <ResultScreen
            key="result"
            lang={lang}
            score={session.score}
            reactionMs={reactionTimes.length ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0}
            patienceSec={patienceSec}
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
