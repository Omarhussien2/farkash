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

type Phase = 'setup' | 'playing' | 'result';

interface Card {
  word: 'run' | 'freeze';
  color: 'green' | 'red';
}

const WORD_META = {
  run: { ar: 'اجري', en: 'Run', correctAction: 'freeze' as const },
  freeze: { ar: 'اقف عندك', en: 'Freeze', correctAction: 'run' as const },
};

const COLOR_META = {
  green: { hex: '#2E7D32', ar: 'أخضر', en: 'Green' },
  red: { hex: '#D84315', ar: 'أحمر', en: 'Red' },
};

function makeCard(): Card {
  const words: Card['word'][] = ['run', 'freeze'];
  const colors: Card['color'][] = ['green', 'red'];
  const word = words[Math.floor(Math.random() * words.length)];
  // 50% congruent, 50% incongruent (Stroop-like)
  const color = Math.random() > 0.5 ? (word === 'run' ? 'green' : 'red') : colors[Math.floor(Math.random() * colors.length)];
  return { word, color };
}

export function AksGame({ onExit }: Props) {
  const { settings } = useApp();
  const lang = settings.lang;
  const game = GAMES.find((g) => g.id === 'aks')!;

  const [phase, setPhase] = useState<Phase>('setup');
  const [idx, setIdx] = useState(0);
  const [card, setCard] = useState<Card>({ word: 'run', color: 'green' });
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState<null | boolean>(null);
  const totalCards = 10;

  const startRef = useRef<number>(0);
  const advanceRef = useRef<number | null>(null);

  const clearAdvance = () => {
    if (advanceRef.current !== null) {
      clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
  };

  useEffect(() => () => clearAdvance(), []);

  const startGame = () => {
    unlockAudio();
    setPhase('playing');
    setIdx(0);
    setScore(0);
    setErrors(0);
    setReactionTimes([]);
    nextCard(0);
  };

  const nextCard = (i: number) => {
    if (i >= totalCards) {
      setPhase('result');
      return;
    }
    const c = makeCard();
    setCard(c);
    setIdx(i);
    setShowFeedback(null);
    startRef.current = Date.now();
    if (settings.speech) {
      const msg = lang === 'ar' ? `${WORD_META[c.word].ar}! اعمل العكس` : `${WORD_META[c.word].en}! Do the opposite`;
      speak(msg);
    }
  };

  const answer = (action: 'run' | 'freeze') => {
    if (showFeedback !== null) return;
    clearAdvance();
    const rt = Date.now() - startRef.current;
    setReactionTimes((p) => [...p, rt]);
    const correct = WORD_META[card.word].correctAction === action;
    if (correct) {
      setScore((s) => s + 10);
      playDing(true);
    } else {
      setErrors((e) => e + 1);
      playWhistle();
    }
    setShowFeedback(correct);
    advanceRef.current = window.setTimeout(() => nextCard(idx + 1), 800);
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
      game: 'aks' as const,
      reactionMs: avg,
      patienceSec: Math.round(score / 5),
      impulsiveErrors: errors,
      score: finalScore,
    };
  };

  const session = buildResult();
  useRecordSession(phase === 'result', session);

  return (
    <GameShell game={game} lang={lang} onExit={handleExit} onRestart={handleRestart} headerColor="#D81B60">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" className="flex-1 px-5 py-6 flex flex-col" exit={{ opacity: 0 }}>
            <div className="text-center mb-6">
              <p className="font-black text-nile-700 text-lg">
                {lang === 'ar' ? `${totalCards} كروت متتالية` : `${totalCards} cards in a row`}
              </p>
              <p className="text-sm font-semibold text-nile-500 mt-3 max-w-xs mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'اعمل العكس بالظبط! لو الكارت قال «اجري»، اقف. لو قال «اقف عندك»، اجري. خلي بالك الكلمة مش اللون!'
                  : 'Do the exact opposite! If the card says "Run", freeze. If it says "Freeze", run. Mind the word, not the color!'}
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center"><GameArtwork game="aks" className="setup-artwork" /></div>
            <Button variant="primary" size="xl" onClick={startGame} className="w-full">
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
                {lang === 'ar' ? `كارت ${idx + 1} / ${totalCards}` : `Card ${idx + 1} / ${totalCards}`}
              </span>
              <span className="font-black text-berry-500">{t(lang, 'score')}: {score}</span>
            </div>

            <div className="text-center font-black text-berry-500 mb-3">{t(lang, 'do_opposite')}</div>

            {/* The card */}
            <motion.div
              className="flex-1 flex items-center justify-center"
              key={`card-${idx}`}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div
                className="w-64 h-72 rounded-3xl shadow-pop flex flex-col items-center justify-center"
                style={{ backgroundColor: COLOR_META[card.color].hex }}
              >
                <span className="text-white text-5xl font-black mb-3">
                  {lang === 'ar' ? WORD_META[card.word].ar : WORD_META[card.word].en}
                </span>
                <span className="text-white/70 text-sm font-bold">
                  {t(lang, 'your_answer')}
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                disabled={showFeedback !== null}
                variant="mint"
                size="lg"
                onClick={() => {
                  playPop();
                  answer('run');
                }}
              >
                {t(lang, 'i_run')}
              </Button>
              <Button
                disabled={showFeedback !== null}
                variant="clay"
                size="lg"
                onClick={() => {
                  playPop();
                  answer('freeze');
                }}
              >
                {t(lang, 'i_freeze')}
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
