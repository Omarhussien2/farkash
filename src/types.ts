export type GameId =
  | 'karasina'
  | 'tamathil'
  | 'ishara'
  | 'aks'
  | 'sabr'
  | 'nafas';

export type TrackId = 'movement' | 'cognitive' | 'calm';

export interface GameMeta {
  id: GameId;
  track: TrackId;
  ar: {
    name: string;
    tagline: string;
    skill: string;
  };
  en: {
    name: string;
    tagline: string;
    skill: string;
  };
  accent: 'nile' | 'mango' | 'clay' | 'mint' | 'berry';
}

export const GAMES: GameMeta[] = [
  {
    id: 'karasina',
    track: 'movement',
    ar: {
      name: 'كراسينا',
      tagline: 'كراسي موسيقية ذكية — صبر وتفاعل',
      skill: 'كبح حركي + رد فعل',
    },
    en: {
      name: 'Smart Chairs',
      tagline: 'Musical chairs with random stops',
      skill: 'Motor inhibition + reaction',
    },
    accent: 'nile',
  },
  {
    id: 'tamathil',
    track: 'movement',
    ar: {
      name: 'تماثيل إسكندرية',
      tagline: 'اجمد وضعية لما الموسيقى تقف',
      skill: 'كبح حركي فوري',
    },
    en: {
      name: 'Freeze Poses',
      tagline: 'Freeze in an Egyptian pose',
      skill: 'Instant motor inhibition',
    },
    accent: 'clay',
  },
  {
    id: 'ishara',
    track: 'movement',
    ar: {
      name: 'إشارة شبرا',
      tagline: 'إشارات + قال السلطان',
      skill: 'انتباه سمعي + كبح',
    },
    en: {
      name: 'Shubra Lights',
      tagline: 'Traffic lights + Simon says',
      skill: 'Auditory attention + inhibition',
    },
    accent: 'mango',
  },
  {
    id: 'aks',
    track: 'cognitive',
    ar: {
      name: 'العكس بالعكس',
      tagline: 'اعمل عكس اللي بتشوفه',
      skill: 'مرونة إدراكية (Stroop)',
    },
    en: {
      name: 'Reverse Logic',
      tagline: 'Do the opposite of what you see',
      skill: 'Cognitive flexibility (Stroop)',
    },
    accent: 'berry',
  },
  {
    id: 'sabr',
    track: 'cognitive',
    ar: {
      name: 'تحدي الصبر واللون',
      tagline: 'استنى الشحن واجمد اللون الغلط',
      skill: 'كبح اندفاعي + صبر',
    },
    en: {
      name: 'Patience & Color',
      tagline: 'Wait for charge, ignore trap colors',
      skill: 'Impulse control + patience',
    },
    accent: 'nile',
  },
  {
    id: 'nafas',
    track: 'calm',
    ar: {
      name: 'نَفَس الزحلفاوي',
      tagline: 'تنفس هادي مع السلحفاة',
      skill: 'تنظيم الغضب والعصبية',
    },
    en: {
      name: 'Turtle Breath',
      tagline: 'Calm breathing with the turtle',
      skill: 'Emotional regulation',
    },
    accent: 'mint',
  },
];

export const TRACKS: Record<
  TrackId,
  { ar: string; en: string; color: string }
> = {
  movement: { ar: 'الحركة الجماعية', en: 'Movement', color: 'nile' },
  cognitive: { ar: 'التركيز وكبح الاندفاع', en: 'Focus & Impulse', color: 'berry' },
  calm: { ar: 'ركن الهدوء', en: 'Calm Corner', color: 'mint' },
};

export interface GameSession {
  id: string;
  game: GameId;
  date: string; // ISO date
  reactionMs: number; // time to stop (lower better)
  patienceSec: number; // seconds of patience gained
  impulsiveErrors: number; // count of impulsive errors
  score: number; // 0..100
}

export type Lang = 'ar' | 'en';
