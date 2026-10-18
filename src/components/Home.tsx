import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Play, Sparkles, Star } from 'lucide-react';
import { BrandSticker, GameArtwork } from '@/components/BrandArtwork';
import { Badge } from '@/components/ui';
import { GAMES, TRACKS, type GameId, type GameMeta, type Lang, type TrackId } from '@/types';
import { BRAND_ASSETS } from '@/brand';
import { t } from '@/utils/i18n';

interface Props {
  lang: Lang;
  onSelect: (id: GameId) => void;
  onQuickDemo: () => void;
}

const TRACK_IDS: TrackId[] = ['movement', 'cognitive', 'calm'];

export function Home({ lang, onSelect, onQuickDemo }: Props) {
  const [filter, setFilter] = useState<TrackId | 'all'>('all');
  const ar = lang === 'ar';
  const games = filter === 'all' ? GAMES : GAMES.filter((game) => game.track === filter);
  return (
    <div className="home-page">
      <section className="brand-hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={16} aria-hidden="true" />{ar ? 'وقت صغير، فرق كبير' : 'SMALL MOMENTS. BIG POSSIBILITIES.'}</p>
          <h1 id="hero-heading">{ar ? <>اللعب أحلى.<br /><span>والنمو خطوة بخطوة.</span></> : <>Made for play.<br /><span>Built for growing.</span></>}</h1>
          <p className="hero-description">{t(lang, 'hero_sub')}</p>
          <div className="hero-actions">
            <button type="button" className="primary-cta" onClick={onQuickDemo}><Play size={19} fill="currentColor" aria-hidden="true" />{ar ? 'يلا نلعب' : 'Let’s play'}</button>
            <a className="secondary-cta" href="#games">{ar ? 'اكتشف الألعاب' : 'Explore the games'}<ChevronDown size={17} aria-hidden="true" /></a>
          </div>
          <div className="hero-note"><span className="note-stars" aria-hidden="true"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></span>{ar ? 'حركة، تركيز، وهدوء… بطريقتنا' : 'A little movement, focus, and calm.'}</div>
        </div>
        <div className="hero-art">
          <img src={BRAND_ASSETS.banner} alt={ar ? 'أصحاب فركش: الطبلة والفرعون وإشارة المرور والسلحفاة' : 'The Farkash friends: a drum, a pharaoh, traffic lights, and a turtle'} width="2752" height="1536" />
          <span className="art-caption"><Sparkles size={17} aria-hidden="true" />{ar ? 'كل يوم فيه فرصة نلعب' : 'Find your happy little moment'}</span>
        </div>
      </section>
      <section id="games" className="games-section" aria-labelledby="games-heading">
        <div className="games-intro">
          <div>
            <p className="eyebrow">{ar ? 'عالم صغير من المغامرات' : 'A LITTLE WORLD OF ADVENTURES'}</p>
            <h2 id="games-heading">{ar ? 'نلعب إيه النهارده؟' : 'What shall we play today?'}</h2>
            <p>{ar ? '٦ ألعاب، ٣ مسارات، وحكاية جديدة مع كل محاولة.' : 'Six games. Three ways to grow. A new adventure every time.'}</p>
          </div>
          <div className="section-stickers"><BrandSticker icon="rainbow" /><BrandSticker icon="ticket" /><BrandSticker icon="star" /></div>
        </div>
        <div className="game-filters" role="group" aria-label={ar ? 'اختار مسار اللعب' : 'Filter games by track'}>
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{ar ? 'كل الألعاب' : 'All games'}<span>{GAMES.length}</span></button>
          {TRACK_IDS.map((id) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{TRACKS[id][lang]}</button>)}
        </div>
        <p className="sr-only" role="status">{ar ? `${games.length} ألعاب` : `${games.length} ${games.length === 1 ? 'game' : 'games'}`}</p>
        <div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} lang={lang} onSelect={() => onSelect(game.id)} />)}</div>
      </section>
      <footer className="home-footer"><BrandSticker icon="ticket" /><p>{ar ? 'صُنع بحب، للّحظات اللي بتفرق.' : 'Made with care, for the moments that matter.'}</p><span>فركش · Farkash</span></footer>
    </div>
  );
}

function GameCard({ game, lang, onSelect }: { game: GameMeta; lang: Lang; onSelect: () => void }) {
  const meta = game[lang];
  return (
    <button type="button" className={`game-card accent-${game.accent}`} onClick={onSelect}>
      <div className="game-card-top"><span className="track-label">{TRACKS[game.track][lang]}</span><span className="game-arrow"><ArrowUpRight size={20} aria-hidden="true" /></span></div>
      <div className="game-illustration" aria-hidden="true"><GameArtwork game={game.id} /></div>
      <div className="game-card-copy"><h3>{meta.name}</h3><p>{meta.tagline}</p><Badge color={game.accent}>{meta.skill}</Badge></div>
    </button>
  );
}
