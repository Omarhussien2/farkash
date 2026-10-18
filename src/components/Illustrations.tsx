interface IconProps {
  className?: string;
}

export function HeronPose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="130" width="200" height="30" fill="#E0D4A8" />
      <ellipse cx="110" cy="70" rx="30" ry="22" fill="#EDE5CC" stroke="#A89866" strokeWidth="2" />
      <circle cx="138" cy="56" r="12" fill="#EDE5CC" stroke="#A89866" strokeWidth="2" />
      <path d="M150 56 L168 52" stroke="#A89866" strokeWidth="3" strokeLinecap="round" />
      <circle cx="142" cy="54" r="2" fill="#0D3A66" />
      <path d="M120 56 L100 46 L118 60 Z" fill="#1E88E5" />
      <path d="M100 92 L100 130" stroke="#A89866" strokeWidth="4" strokeLinecap="round" />
      <path d="M118 92 L130 130" stroke="#A89866" strokeWidth="4" strokeLinecap="round" />
      <path d="M95 130 L108 130 L100 124 Z" fill="#A89866" />
    </svg>
  );
}


export function NileBoatPose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="110" width="200" height="50" fill="#1E88E5" />
      <path d="M40 110 Q100 130 160 110 L150 124 L50 124 Z" fill="#8D6E63" />
      <rect x="95" y="60" width="6" height="50" fill="#5D4037" />
      <path d="M101 60 L140 90 L101 90 Z" fill="#FFC107" />
      <circle cx="100" cy="40" r="14" fill="#FFC107" />
      <path d="M86 110 Q100 118 114 110" stroke="#fff" strokeWidth="2" fill="none" />
    </svg>
  );
}

