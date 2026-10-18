// Egyptian Voice Engine — 3-layer hybrid speech system.
//
// Layer 1: Pre-recorded Egyptian MP3s from /audio/*.mp3 (authentic, zero robot voice).
//          If a recording is missing, we fall through seamlessly.
// Layer 2: Optional ElevenLabs TTS (eleven_multilingual_v2) using a user-provided API
//          key stored in localStorage. Generated blobs are cached in memory so the
//          same phrase is only fetched once.
// Layer 3: Browser SpeechSynthesis — with an Egyptian phonetic respelling dictionary
//          (vocalized spelling so the TTS gets the Egyptian rhythm right) and a smart
//          voice selector that prioritizes natural ar-EG voices (Hoda / Salma / Shakir /
//          Google Arabic), tuned to an energetic party-host tone (rate 1.08, pitch 1.1).

let enabled = true;
let speechVersion = 0;

// ---------------------------------------------------------------------------
// Shared playback state
// ---------------------------------------------------------------------------

let currentEl: HTMLAudioElement | null = null;

function playUrl(url: string, requestVersion: number): Promise<boolean> {
  if (!enabled || requestVersion !== speechVersion) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    try {
      const el = new Audio(url);
      el.volume = 1;
      el.onerror = () => done(false);
      currentEl = el;
      el.onplaying = () => {
        if (!enabled || requestVersion !== speechVersion) { el.pause(); done(false); return; }
        currentEl = el;
        done(true);
      };
      void el.play().catch(() => done(false));
    } catch {
      done(false);
    }
  });
}

// ---------------------------------------------------------------------------
// Layer 1: pre-recorded Egyptian audio files
// ---------------------------------------------------------------------------

// Phrase (normalized) -> local file. Drop real recordings into public/audio/
// and list their filenames in public/audio/manifest.json for instant playback.
const RECORDINGS: Record<string, string> = {
  'يلا اجروا على الكراسي': '/audio/karasina_start.mp3',
  'فركش': '/audio/farkash.mp3',
  'اجري والعب': '/audio/run_play.mp3',
  'ابو الهول': '/audio/sphinx.mp3',
  'العرقسوس': '/audio/erksous.mp3',
  'مالك الحزين': '/audio/heron.mp3',
  'تمثال رمسيس': '/audio/ramses.mp3',
  'المركب في النيل': '/audio/boat.mp3',
  'اشارة خضرا': '/audio/green.mp3',
  'اشارة صفرا': '/audio/yellow.mp3',
  'اشارة حمرا': '/audio/red.mp3',
  'مقالش السلطان': '/audio/no_sultan.mp3',
  'اجري! اعمل العكس': '/audio/aks_run.mp3',
  'اقف عندك! اعمل العكس': '/audio/aks_stop.mp3',
  'استنى ما البطارية تتشحن': '/audio/sabr_wait.mp3',
  'دلوقتي! دوس بسرعة': '/audio/sabr_tap.mp3',
  'متتسرعش! استنى الشحن': '/audio/sabr_rush.mp3',
  'حاسب ده فخ! متلمسش اللون ده': '/audio/sabr_trap.mp3',
  'خد نفس عميق بالراحة': '/audio/inhale.mp3',
  'طلع الهوا بشويش': '/audio/exhale.mp3',
  'احبس النفس ثانية': '/audio/hold.mp3',
};

/** Strip tashkeel and unify letter forms so matching survives vocalized text. */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // tashkeel + superscript alif
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .trim();
}

// Smart availability check: a single cached fetch of /audio/manifest.json tells
// us exactly which recordings exist — no per-file HEAD requests, no 404 noise
// in the console. Falls back to a cached HEAD probe only if the manifest itself
// is missing.
const MANIFEST_URL = '/audio/manifest.json';
let manifestPromise: Promise<Set<string> | null> | null = null;

function loadManifest(): Promise<Set<string> | null> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { files?: unknown } | null) => {
        if (!json || !Array.isArray(json.files)) return null;
        const urls = new Set(
          json.files.filter((f): f is string => typeof f === 'string').map((f) => `/audio/${f}`)
        );
        // Preload: warm the browser cache so first playback is instant.
        urls.forEach((u) => {
          try {
            const el = new Audio();
            el.preload = 'auto';
            el.src = u;
            el.load();
          } catch {
            // ignore — preload is an optimization only
          }
        });
        return urls;
      })
      .catch(() => null);
  }
  return manifestPromise;
}

// Fallback probe (used only when manifest.json is absent).
const availability = new Map<string, Promise<boolean>>();

function headProbe(url: string): Promise<boolean> {
  let p = availability.get(url);
  if (!p) {
    p = fetch(url, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') || '';
        // Dev servers SPA-fallback unknown paths to index.html (200 text/html) —
        // only accept responses that are actually audio.
        return r.ok && type.startsWith('audio');
      })
      .catch(() => false);
    availability.set(url, p);
  }
  return p;
}

async function isRecordingAvailable(url: string): Promise<boolean> {
  const manifest = await loadManifest();
  if (manifest) return manifest.has(url);
  return headProbe(url);
}

function findRecording(text: string): string | null {
  const norm = normalizeArabic(text);
  for (const [phrase, url] of Object.entries(RECORDINGS)) {
    if (norm.includes(normalizeArabic(phrase))) return url;
  }
  return null;
}

async function tryLayer1(text: string, requestVersion: number): Promise<boolean> {
  const url = findRecording(text);
  if (!url) return false;
  if (!(await isRecordingAvailable(url))) return false;
  return playUrl(url, requestVersion);
}

// ---------------------------------------------------------------------------
// Layer 2: optional ElevenLabs TTS (eleven_multilingual_v2)
// ---------------------------------------------------------------------------

const EL_KEY_LS = 'farkash.elevenlabs.key';
const EL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // default voice; swap via setElevenLabsVoice()

let elVoiceId = EL_VOICE_ID;
const elBlobCache = new Map<string, string>(); // phrase -> object URL
const elInflight = new Map<string, Promise<boolean>>();
let elDisabledUntil = 0; // backoff window after auth/quota/network failures

export function getElevenLabsKey(): string {
  try {
    return localStorage.getItem(EL_KEY_LS) || '';
  } catch {
    return '';
  }
}

export function setElevenLabsKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(EL_KEY_LS, key.trim());
    else localStorage.removeItem(EL_KEY_LS);
  } catch {
    // private mode — key just won't persist
  }
  elBlobCache.forEach((url) => URL.revokeObjectURL(url));
  elBlobCache.clear();
  elDisabledUntil = 0;
}

export function setElevenLabsVoice(voiceId: string): void {
  if (voiceId.trim()) elVoiceId = voiceId.trim();
}

async function tryLayer2(text: string, requestVersion: number): Promise<boolean> {
  const key = getElevenLabsKey();
  if (!key) return false;
  if (Date.now() < elDisabledUntil) return false;

  const cached = elBlobCache.get(text);
  if (cached) return playUrl(cached, requestVersion);

  const pending = elInflight.get(text);
  if (pending) return pending;

  const job = (async () => {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}?output_format=mp3`,
        {
          method: 'POST',
          headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.32,
              similarity_boost: 0.8,
              style: 0.55,
              use_speaker_boost: true,
            },
          }),
        }
      );
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      elBlobCache.set(text, url); // in-memory cache: never re-fetch the same phrase
      return await playUrl(url, requestVersion);
    } catch {
      // Bad key / no quota / offline — back off 60s so we don't spam failing calls,
      // and let Layer 3 handle everything meanwhile.
      elDisabledUntil = Date.now() + 60_000;
      return false;
    } finally {
      elInflight.delete(text);
    }
  })();

  elInflight.set(text, job);
  return job;
}

// ---------------------------------------------------------------------------
// Layer 3: browser TTS with Egyptian phonetic respelling
// ---------------------------------------------------------------------------

// Unvocalized Egyptian slang gets read as stiff MSA — respell it with full
// tashkeel so the utterance lands with an authentic Egyptian rhythm.
const EGYPTIAN_PHONETICS: [string, string][] = [
  ['اثبت', 'إِثْبَتْ عَنْدَكْ'],
  ['اجري', 'إِجْرِي بِسُرْعَة'],
  ['اقف', 'إِقَفْ مَكَانَكْ'],
  ['فركش', 'فَرْكِشْ'], // stop call; the game phrase already carries «اقعدوا بسرعة»
  ['أبو الهول', 'أَبُو الْهُولْ'],
  ['العرقسوس', 'العِرْقْسُوسْ'],
  ['عاش يا بطل', 'عَاشْ يَا بَطَلْ، بْرَافُو عَلِيكْ'],
];

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ARABIC_LETTER = /[\u0621-\u064A]/;

/** Replace Egyptian phrases with vocalized spellings, whole-word matches only. */
export function vocalizeEgyptian(text: string): string {
  let out = text;
  for (const [raw, vocalized] of EGYPTIAN_PHONETICS) {
    const re = new RegExp(escapeForRegex(raw), 'g');
    out = out.replace(re, (match, offset: number) => {
      const before = out[offset - 1] ?? ' ';
      const after = out[offset + match.length] ?? ' ';
      // Skip partial hits inside longer words (e.g. اقف inside اقفوا).
      if (ARABIC_LETTER.test(before) || ARABIC_LETTER.test(after)) return match;
      return vocalized;
    });
  }
  return out;
}

let voices: SpeechSynthesisVoice[] = [];

function loadVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices();
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Natural Egyptian voices first: Microsoft Hoda/Salma/Shakir, Google Arabic,
// then any ar-EG, then any other Arabic voice.
const NATURAL_VOICE_HINTS = ['hoda', 'salma', 'shakir', 'maged', 'zariyah', 'fatima', 'google arabic'];

function pickVoice(arabic: boolean): SpeechSynthesisVoice | null {
  if (!voices.length) loadVoices();
  if (!voices.length) return null;
  if (!arabic) return voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ?? null;
  const isEG = (v: SpeechSynthesisVoice) => (v.lang || '').toLowerCase() === 'ar-eg';
  const hintHit = (v: SpeechSynthesisVoice) =>
    NATURAL_VOICE_HINTS.some((h) => v.name.toLowerCase().includes(h));
  return (
    voices.find((v) => isEG(v) && hintHit(v)) ??
    voices.find((v) => hintHit(v)) ??
    voices.find((v) => isEG(v)) ??
    voices.find((v) => (v.lang || '').toLowerCase().startsWith('ar')) ??
    null
  );
}

function speakBrowser(text: string, opts?: { rate?: number; pitch?: number }): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const arabic = ARABIC_LETTER.test(text);
    const utter = new SpeechSynthesisUtterance(arabic ? vocalizeEgyptian(text) : text);
    utter.lang = arabic ? 'ar-EG' : 'en-US';
    // Energetic, child-friendly party-host tone (unless a caller overrides).
    utter.rate = opts?.rate ?? 1.08;
    utter.pitch = opts?.pitch ?? 1.1;
    utter.volume = 1;
    const v = pickVoice(arabic);
    if (v) utter.voice = v;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore — speech is a nice-to-have
  }
}

// ---------------------------------------------------------------------------
// Public API — same `speak()` signature the games already use
// ---------------------------------------------------------------------------

/** Speak a phrase with the best available Egyptian voice: MP3 → ElevenLabs → browser TTS. */
export function speak(text: string, opts?: { rate?: number; pitch?: number }): void {
  if (!enabled) return;
  stopSpeaking();
  const requestVersion = speechVersion;
  void (async () => {
    if (await tryLayer1(text, requestVersion)) return;
    if (!enabled || requestVersion !== speechVersion) return;
    if (await tryLayer2(text, requestVersion)) return;
    if (!enabled || requestVersion !== speechVersion) return;
    speakBrowser(text, opts);
  })();
}

export function stopSpeaking(): void {
  speechVersion++;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (currentEl) {
    try {
      currentEl.pause();
    } catch {
      // ignore
    }
    currentEl = null;
  }
}

export function setSpeechEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeaking();
}

export function isSpeechEnabled(): boolean {
  return enabled;
}
