import { Gamepad2, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import type { Lang } from '@/types';
import { t } from '@/utils/i18n';

export type TabId = 'games' | 'report' | 'settings';
interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  lang: Lang;
}

export function BottomNav({ active, onChange, lang }: Props) {
  const tabs = [
    { id: 'games', icon: Gamepad2, label: t(lang, 'tab_games') },
    { id: 'report', icon: BarChart3, label: t(lang, 'tab_report') },
    { id: 'settings', icon: SettingsIcon, label: t(lang, 'tab_settings') },
  ] as const;
  return (
    <nav className="bottom-nav" aria-label={lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}>
      <div>{tabs.map(({ id, icon: Icon, label }) => (
        <button type="button" key={id} onClick={() => onChange(id)} aria-current={active === id ? 'page' : undefined}>
          <Icon size={21} strokeWidth={2} aria-hidden="true" /><span>{label}</span>
        </button>
      ))}</div>
    </nav>
  );
}
