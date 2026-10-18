import { useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff, RotateCcw, Languages, Sparkles } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { Card } from '@/components/ui';
import { t } from '@/utils/i18n';
import { getElevenLabsKey, setElevenLabsKey } from '@/utils/speech';
import type { Lang } from '@/types';

export function Settings() {
  const { settings, setLang, toggleSound, toggleSpeech, resetData } = useApp();
  const lang = settings.lang;
  return (
    <div className="content-page">
      <h1 className="text-2xl font-black text-nile-800 mb-1">{t(lang, 'tab_settings')}</h1>
      <p className="text-sm font-semibold text-nile-500 mb-6">{t(lang, 'app_tagline')}</p>

      <div className="space-y-4">
        {/* Language */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Languages className="w-6 h-6 text-nile-500" />
            <h3 className="font-black text-nile-800">{t(lang, 'settings_lang')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['ar', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`py-3 rounded-2xl font-black text-sm ${
                  lang === l
                    ? 'bg-nile-500 text-white shadow-soft'
                    : 'bg-sand-100 text-nile-600'
                }`}
              >
                {l === 'ar' ? 'العربية المصرية' : 'English'}
              </button>
            ))}
          </div>
        </Card>

        {/* Sound */}
        <Card className="p-4">
          <button role="switch" aria-checked={settings.sound} onClick={toggleSound} className="flex items-center gap-3 w-full min-h-11">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${settings.sound ? 'bg-nile-100 text-nile-600' : 'bg-sand-200 text-sand-400'}`}>
              {settings.sound ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </div>
            <div className="flex-1 text-start">
              <h3 className="font-black text-nile-800">{t(lang, 'settings_sound')}</h3>
            </div>
            <Toggle on={settings.sound} />
          </button>
        </Card>

        {/* Speech */}
        <Card className="p-4">
          <button role="switch" aria-checked={settings.speech} onClick={toggleSpeech} className="flex items-center gap-3 w-full min-h-11">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${settings.speech ? 'bg-mango-100 text-mango-800' : 'bg-sand-200 text-sand-400'}`}>
              {settings.speech ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </div>
            <div className="flex-1 text-start">
              <h3 className="font-black text-nile-800">{t(lang, 'settings_speech')}</h3>
            </div>
            <Toggle on={settings.speech} />
          </button>
        </Card>

        {/* ElevenLabs optional key */}
        <ElevenLabsCard lang={lang} />

        {/* Reset demo data */}
        <Card className="p-4">
          <button onClick={() => { if (window.confirm(lang === 'ar' ? 'ترجع بيانات التجربة؟ ده هيمسح جلسات اللعب المحفوظة.' : 'Restore demo data? This replaces your saved play sessions.')) resetData(); }} className="flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-clay-100 text-clay-600">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="flex-1 text-start">
              <h3 className="font-black text-nile-800">{t(lang, 'settings_reset')}</h3>
              <p className="text-xs font-semibold text-nile-500">{t(lang, 'settings_reset_desc')}</p>
            </div>
          </button>
        </Card>

        <p className="text-center text-xs text-sand-400 font-semibold pt-4">
          {lang === 'ar' ? 'فركش · صنع بُحب لطفلك' : 'Farkash · Made with care for your little one'}
        </p>
      </div>
    </div>
  );
}

function ElevenLabsCard({ lang }: { lang: Lang }) {
  const [value, setValue] = useState(getElevenLabsKey());
  const [saved, setSaved] = useState(false);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-berry-500/15 text-berry-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-nile-800">{t(lang, 'settings_elevenlabs')}</h3>
          <p className="text-xs font-semibold text-nile-500">{t(lang, 'settings_elevenlabs_desc')}</p>
        </div>
      </div>
      <label htmlFor="elevenlabs-key" className="block text-xs font-bold text-nile-800 mb-2">{t(lang, 'settings_elevenlabs')}</label>
      <input
        id="elevenlabs-key"
        type="password"
        dir="ltr"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder={t(lang, 'elevenlabs_placeholder')}
        className="w-full bg-sand-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-nile-800 outline-none focus:ring-2 focus:ring-nile-300 placeholder:text-nile-400"
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => {
            setElevenLabsKey(value);
            setSaved(true);
          }}
          className="px-4 py-2 rounded-xl bg-nile-500 text-white text-sm font-black"
        >
          {t(lang, 'save')}
        </button>
        <button
          onClick={() => {
            setElevenLabsKey('');
            setValue('');
            setSaved(false);
          }}
          className="px-4 py-2 rounded-xl bg-sand-200 text-nile-600 text-sm font-black"
        >
          {t(lang, 'clear')}
        </button>
        {saved && <span role="status" className="text-xs font-black text-mint-600">{t(lang, 'key_saved')}</span>}
      </div>
    </Card>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div aria-hidden="true" dir="ltr" className={`shrink-0 w-12 h-7 rounded-full p-1 transition-colors ${on ? 'bg-mint-500' : 'bg-sand-300'}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </div>
  );
}
