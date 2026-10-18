import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Play, Square, Music, Upload, VolumeX } from 'lucide-react';
import { GameArtwork } from '@/components/BrandArtwork';
import { GameShell, ResultScreen } from '@/components/GameShell';
import { Button, Card } from '@/components/ui';
import { useRecordSession } from '@/hooks/useRecordSession';
import { useApp } from '@/store/useApp';
import { GAMES } from '@/types';
import { t } from '@/utils/i18n';
import {
  startMusic,
  stopMusic,
  stopMusicWithFarkash,
  unlockAudio,
} from '@/utils/egyptianAudioEngine';
import { speak } from '@/utils/speech';

interface Props {
  onExit: () => void;
}

type Phase = 'setup' | 'playing' | 'stopped' | 'result';

export function KarasinaGame({ onExit }: Props) {
  const { settings } = useApp();
  const lang = settings.lang;
  const game = GAMES.find((g) => g.id === 'karasina')!;

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState(5);
  const [minSec, setMinSec] = useState(5);
  const [maxSec, setMaxSec] = useState(15);
  const chairs = Math.max(0, players - 1);
  const [round, setRound] = useState(1);
  const [reactionMs, setReactionMs] = useState(0);
  const [seated, setSeated] = useState(false);
  const [totalReaction, setTotalReaction] = useState(0);
  const [eliminated, setEliminated] = useState(0);

  const stopTimeRef = useRef<number>(0);
  const stopTimerRef = useRef<number | null>(null);

  // Optional MP3 upload: replaces the tabla loop when provided.
  const [mp3Name, setMp3Name] = useState<string | null>(null);
  const mp3UrlRef = useRef<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const handleMp3File = (file: File | undefined) => {
    if (!file) return;
    if (mp3UrlRef.current) URL.revokeObjectURL(mp3UrlRef.current);
    const url = URL.createObjectURL(file);
    mp3UrlRef.current = url;
    setMp3Name(file.name);
    if (!audioElRef.current) {
      audioElRef.current = new Audio();
      audioElRef.current.loop = true;
    }
    audioElRef.current.src = url;
  };

  const playMp3 = () => {
    if (audioElRef.current && mp3UrlRef.current) {
      void audioElRef.current.play().catch(() => undefined);
      return true;
    }
    return false;
  };

  const pauseMp3 = () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
  };

  useEffect(
    () => () => {
      pauseMp3();
      if (mp3UrlRef.current) URL.revokeObjectURL(mp3UrlRef.current);
    },
    []
  );

  const clearStopTimer = () => {
    if (stopTimerRef.current !== null) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  useEffect(() => () => clearStopTimer(), []);

  const beginRound = useCallback(() => {
    unlockAudio();
    setPhase('playing');
    setSeated(false);
    if (settings.sound && !playMp3()) startMusic();
    if (settings.speech) speak(lang === 'ar' ? 'يلا اجروا على الكراسي!' : 'Run to the chairs!');
    const delay = (minSec + Math.random() * (maxSec - minSec)) * 1000;
    stopTimeRef.current = Date.now() + delay;
    stopTimerRef.current = window.setTimeout(() => {
      pauseMp3();
      stopMusicWithFarkash();
      stopTimeRef.current = Date.now();
      setPhase('stopped');
      if (settings.speech) speak(lang === 'ar' ? 'فركش! اقعدوا بسرعة!' : 'Farkash! Freeze!');
    }, delay);
  }, [minSec, maxSec, lang, settings.speech, settings.sound]);

  const confirmSeated = () => {
    if (seated) return;
    const reaction = Date.now() - stopTimeRef.current;
    setReactionMs(reaction);
    setTotalReaction((total) => total + reaction);
    setSeated(true);
  };

  const eliminatePlayer = () => {
    if (players <= 1) return;
    const newPlayers = players - 1;
    setPlayers(newPlayers);
    setEliminated((e) => e + 1);
    if (newPlayers <= 1) {
      finishGame();
    } else {
      setRound((r) => r + 1);
      setPhase('setup');
    }
  };

  const finishGame = useCallback(() => {
    setPhase('result');
    pauseMp3();
    stopMusic();
  }, []);

  const handleExit = () => {
    pauseMp3();
    stopMusic();
    clearStopTimer();
    onExit();
  };

  const handleRestart = () => {
    clearStopTimer();
    pauseMp3();
    stopMusic();
    setPhase('setup');
    setPlayers(5);
    setRound(1);
    setReactionMs(0);
    setTotalReaction(0);
    setEliminated(0);
  };

  const buildResult = () => {
    const avgReaction = Math.round(totalReaction / Math.max(1, round));
    const score = Math.max(20, Math.min(100, 100 - Math.round((avgReaction - 200) / 8) - eliminated * 5));
    return {
      game: 'karasina' as const,
      reactionMs: avgReaction,
      patienceSec: round * 2,
      impulsiveErrors: eliminated,
      score,
    };
  };

  const session = buildResult();
  useRecordSession(phase === 'result', session);

  return (
    <GameShell game={game} lang={lang} onExit={handleExit} onRestart={handleRestart} headerColor="#1E88E5">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" className="flex-1 px-5 py-6 flex flex-col" exit={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-5 h-5 text-nile-500" />
              <span className="font-black text-nile-800">
                {lang === 'ar' ? `الجولة ${round}` : `Round ${round}`}
              </span>
            </div>
            <GameArtwork game="karasina" className="setup-artwork" />
            <Card className="p-4 mb-4">
              <p className="font-bold text-nile-700 mb-3">{t(lang, 'players')}</p>
              <Stepper value={players} onChange={setPlayers} min={2} max={12} />
            </Card>
            <Card className="p-4 mb-4">
              <p className="font-bold text-nile-700 mb-3">{t(lang, 'min_seconds')}</p>
              <Stepper value={minSec} onChange={(v) => setMinSec(Math.min(v, maxSec))} min={3} max={30} />
              <p className="font-bold text-nile-700 mb-3 mt-4">{t(lang, 'max_seconds')}</p>
              <Stepper value={maxSec} onChange={(v) => setMaxSec(Math.max(v, minSec))} min={4} max={45} />
            </Card>
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-nile-700">{lang === 'ar' ? 'كراسي' : 'Chairs'}</span>
                <span className="text-2xl font-black text-clay-600">{chairs}</span>
              </div>
            </Card>
            <Card className="p-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-2xl bg-mango-100 text-mango-800 flex items-center justify-center shrink-0">
                  {mp3Name ? <Music className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-nile-800 text-sm">
                    {lang === 'ar' ? 'أغنية خارجية (اختياري)' : 'Custom song (optional)'}
                  </p>
                  <p className="text-xs font-semibold text-nile-500 truncate">
                    {mp3Name ?? (lang === 'ar' ? 'ارفع MP3 بدل الطبلة' : 'Upload MP3 instead of tabla')}
                  </p>
                </div>
                {mp3Name && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      pauseMp3();
                      if (mp3UrlRef.current) URL.revokeObjectURL(mp3UrlRef.current);
                      mp3UrlRef.current = null;
                      setMp3Name(null);
                    }}
                    className="w-9 h-9 rounded-xl bg-sand-200 text-clay-600 flex items-center justify-center"
                    aria-label={lang === 'ar' ? 'شيل الأغنية' : 'Remove song'}
                  >
                    <VolumeX className="w-5 h-5" />
                  </button>
                )}
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleMp3File(e.target.files?.[0])}
                />
              </label>
            </Card>
            <div className="mt-auto">
              <Button variant="primary" size="xl" onClick={beginRound} className="w-full">
                <span className="flex items-center justify-center gap-2">
                  <Play className="w-6 h-6" />
                  {t(lang, 'start')}
                </span>
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div key="playing" className="flex-1 flex flex-col items-center justify-center px-5" exit={{ opacity: 0 }}>
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-nile-400/40"
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <motion.div
                className="w-48 h-48 rounded-full bg-nile-500 flex items-center justify-center shadow-soft"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Music className="w-20 h-20 text-white" />
              </motion.div>
            </div>
            <p className="text-center font-black text-xl text-nile-700 mt-8 max-w-xs">
              {t(lang, 'music_playing')}
            </p>
            <Button variant="clay" size="lg" className="mt-6" onClick={() => {
              clearStopTimer();
              pauseMp3();
              stopMusicWithFarkash();
              stopTimeRef.current = Date.now();
              setPhase('stopped');
            }}>
              <span className="flex items-center gap-2">
                <Square className="w-5 h-5" />
                {t(lang, 'stop')}
              </span>
            </Button>
          </motion.div>
        )}

        {phase === 'stopped' && (
          <motion.div
            key="stopped"
            className="flex-1 flex flex-col items-center justify-center px-5 bg-clay-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h2
              className="text-5xl font-black text-white mb-2"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {t(lang, 'freeze_now')}
            </motion.h2>
            <p className="text-white/90 font-bold mb-8">
              {seated ? (lang === 'ar' ? `زمن التأكيد: ${reactionMs} مللي` : `Confirmation time: ${reactionMs} ms`) : (lang === 'ar' ? 'اضغط أول ما تقعد' : 'Tap as soon as you sit down')}
            </p>
            <div className="w-full max-w-xs space-y-3">
              <Button variant="mango" size="lg" className="w-full" onClick={seated ? eliminatePlayer : confirmSeated}>
                <span className="flex items-center justify-center gap-2">
                  <Minus className="w-5 h-5" />
                  {seated ? t(lang, 'remove_chair') : lang === 'ar' ? 'قعدت!' : 'I’m seated!'}
                </span>
              </Button>
              {players > 1 && seated && (
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setRound((r) => r + 1);
                    setPhase('setup');
                  }}
                >
                  {t(lang, 'next')}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <ResultScreen
            key="result"
            lang={lang}
            score={session.score}
            reactionMs={Math.round(totalReaction / Math.max(1, round))}
            patienceSec={round * 2}
            errors={eliminated}
            onPlayAgain={handleRestart}
            onExit={handleExit}
          />
        )}
      </AnimatePresence>
    </GameShell>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        aria-label={t(document.documentElement.lang === 'ar' ? 'ar' : 'en', 'decrease')}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-12 h-12 rounded-2xl bg-nile-100 text-nile-600 flex items-center justify-center"
      >
        <Minus className="w-6 h-6" />
      </button>
      <span className="text-3xl font-black text-nile-800 flex-1 text-center">{value}</span>
      <button
        aria-label={t(document.documentElement.lang === 'ar' ? 'ar' : 'en', 'increase')}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-12 h-12 rounded-2xl bg-nile-100 text-nile-600 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
