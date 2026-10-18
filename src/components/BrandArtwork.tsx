import { BRAND_ASSETS, GAME_ARTWORK } from '@/brand';
import type { GameId } from '@/types';

export function BrandSticker({ icon, className = '' }: { icon: 'star' | 'rainbow' | 'ticket'; className?: string }) {
  return <span aria-hidden="true" className={`brand-sticker sticker-${icon} ${className}`} style={{ backgroundImage: `url("${BRAND_ASSETS.stickers}")` }} />;
}

export function GameArtwork({ game, className = '' }: { game: GameId; className?: string }) {
  return <img src={GAME_ARTWORK[game]} alt="" aria-hidden="true" width="1792" height="2400" loading="lazy" decoding="async" className={`game-artwork ${className}`} />;
}
