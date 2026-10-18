import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { BrandSticker } from '@/components/BrandArtwork';
import { BottomNav, type TabId } from '@/components/BottomNav';
import { Home } from '@/components/Home';
import { AppProvider } from '@/store/AppContext';
import { useApp } from '@/store/useApp';
import type { GameId } from '@/types';
const KarasinaGame = lazy(() => import('@/games/KarasinaGame').then((module) => ({ default: module.KarasinaGame })));
const TamathilGame = lazy(() => import('@/games/TamathilGame').then((module) => ({ default: module.TamathilGame })));
const IsharaGame = lazy(() => import('@/games/IsharaGame').then((module) => ({ default: module.IsharaGame })));
const AksGame = lazy(() => import('@/games/AksGame').then((module) => ({ default: module.AksGame })));
const SabrGame = lazy(() => import('@/games/SabrGame').then((module) => ({ default: module.SabrGame })));
const NafasGame = lazy(() => import('@/games/NafasGame').then((module) => ({ default: module.NafasGame })));

const Report = lazy(() => import('@/components/Report').then((module) => ({ default: module.Report })));
const Settings = lazy(() => import('@/components/Settings').then((module) => ({ default: module.Settings })));

const GAME_COMPONENTS: Record<GameId, LazyExoticComponent<ComponentType<{ onExit: () => void }>>> = {
  karasina: KarasinaGame,
  tamathil: TamathilGame,
  ishara: IsharaGame,
  aks: AksGame,
  sabr: SabrGame,
  nafas: NafasGame,
};

function Shell() {
  const { settings, setLang } = useApp();
  const [tab, setTab] = useState<TabId>(() => new URLSearchParams(window.location.search).get('view') === 'report' ? 'report' : 'games');
  const [activeGame, setActiveGame] = useState<GameId | null>(() => {
    const game = new URLSearchParams(window.location.search).get('game');
    return game && Object.prototype.hasOwnProperty.call(GAME_COMPONENTS, game) ? game as GameId : null;
  });
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [tab, activeGame]);

  const openGame = (id: GameId) => setActiveGame(id);
  const exitGame = () => setActiveGame(null);

  const handleTab = (t: TabId) => {
    setActiveGame(null);
    setTab(t);
  };

  let screen: JSX.Element;
  if (activeGame) {
    const Game = GAME_COMPONENTS[activeGame];
    screen = <Game key={activeGame} onExit={exitGame} />;
  } else if (tab === 'report') {
    screen = <Report onSelect={openGame} />;
  } else if (tab === 'settings') {
    screen = <Settings />;
  } else {
    screen = <Home lang={settings.lang} onSelect={openGame} onQuickDemo={() => openGame('karasina')} />;
  }

  return (
    <div className={`app-shell ${activeGame ? 'app-shell-game' : ''}`}>
      <a href="#main-content" className="skip-link">{settings.lang === 'ar' ? 'تخطى للمحتوى' : 'Skip to content'}</a>
      {!activeGame && <header className="site-header">
        <button className="wordmark" onClick={() => handleTab('games')} aria-label={settings.lang === 'ar' ? 'فركش — الرئيسية' : 'Farkash — home'}><BrandSticker icon="star" /><span>فركش<small>FARKASH</small></span></button>
        <p className="header-tagline">{settings.lang === 'ar' ? 'نلعب. نركز. نكبر.' : 'Play. Focus. Grow.'}</p>
          <button
            onClick={() => setLang(settings.lang === 'ar' ? 'en' : 'ar')}
            className="language-switch"
            aria-label={settings.lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          >
            <Languages size={17} aria-hidden="true" />
            {settings.lang === 'ar' ? 'EN' : 'عربي'}
          </button>
      </header>}
      <main id="main-content" ref={mainRef} tabIndex={-1}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeGame ?? tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Suspense fallback={<p role="status" className="p-12 text-center font-bold">{settings.lang === 'ar' ? 'لحظة واحدة…' : 'Loading…'}</p>}>{screen}</Suspense>
        </motion.div>
      </AnimatePresence>
      </main>
      {!activeGame && <BottomNav active={tab} onChange={handleTab} lang={settings.lang} />}
    </div>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user"><AppProvider>
      <Shell />
    </AppProvider></MotionConfig>
  );
}

export default App;
