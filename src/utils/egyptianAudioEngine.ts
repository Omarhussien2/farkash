// Egyptian Audio Engine — Web Audio API powered drum rhythm + whistle + farkash stop sound.
// Generates a lively Egyptian tabla rhythm ("dum tak dum dum tak") while music plays,
// and a sharp referee whistle + tabla strike when the music stops.

let soundEnabled = true;
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let rhythmTimer: number | null = null;
let stepIndex = 0;
let isPlaying = false;

function ensureContext(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = soundEnabled ? 0.9 : 0;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0;
    musicGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Resume audio context after a user gesture (required by autoplay policies). */
export function unlockAudio(): void {
  ensureContext();
}

// ---- Drum synthesis (membrane-style "dum" + "tak") ----

function playDum(time: number, gain: number): void {
  if (!ctx || !musicGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(60, time + 0.18);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(time);
  osc.stop(time + 0.25);
}

function playTak(time: number, gain: number): void {
  if (!ctx || !musicGain) return;
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  noise.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
  noise.connect(bp);
  bp.connect(g);
  g.connect(musicGain);
  noise.start(time);
  noise.stop(time + 0.08);
}

function playHat(time: number, gain: number): void {
  if (!ctx || !musicGain) return;
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
  }
  noise.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
  noise.connect(hp);
  hp.connect(g);
  g.connect(musicGain);
  noise.start(time);
  noise.stop(time + 0.05);
}

// Egyptian tabla pattern: 1=dum, 2=tak, 3=hat
const PATTERN = [1, 2, 3, 2, 1, 1, 2, 3];
const STEP_INTERVAL = 0.22; // seconds per step (~272 BPM eighth notes)

function scheduleStep(): void {
  if (!ctx || !isPlaying) return;
  const now = ctx.currentTime;
  const hit = PATTERN[stepIndex % PATTERN.length];
  if (hit === 1) playDum(now, 0.9);
  else if (hit === 2) playTak(now, 0.55);
  else playHat(now, 0.25);
  stepIndex++;
  rhythmTimer = window.setTimeout(scheduleStep, STEP_INTERVAL * 1000);
}

/** Start the lively Egyptian tabla rhythm. */
export function startMusic(): void {
  ensureContext();
  if (isPlaying) return;
  isPlaying = true;
  stepIndex = 0;
  if (musicGain && ctx) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
  }
  scheduleStep();
}

/** Abruptly stop the music and play the "farkash" stop sound (whistle + tabla strike). */
export function stopMusicWithFarkash(): void {
  if (!ctx || !masterGain) {
    isPlaying = false;
    return;
  }
  isPlaying = false;
  if (rhythmTimer !== null) {
    clearTimeout(rhythmTimer);
    rhythmTimer = null;
  }
  if (musicGain) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
  }
  const now = ctx.currentTime;
  playWhistle(now);
  playDum(now + 0.02, 1.2);
  playDum(now + 0.18, 0.9);
}

/** Stop music silently (no farkash). */
export function stopMusic(): void {
  isPlaying = false;
  if (rhythmTimer !== null) {
    clearTimeout(rhythmTimer);
    rhythmTimer = null;
  }
  if (musicGain && ctx) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
  }
}

/** Play the referee whistle. */
export function playWhistle(time?: number): void {
  if (!ctx || !masterGain) return;
  const t = time ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(2400, t);
  osc.frequency.linearRampToValueAtTime(2600, t + 0.35);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 18;
  lfoGain.gain.value = 120;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.42);
  lfo.stop(t + 0.42);
}

/** Short pleasant "ding" used for success/correct actions. */
export function playDing(positive: boolean = true): void {
  if (!ctx || !masterGain) return;
  const t = ctx.currentTime;
  const freq = positive ? 880 : 220;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = positive ? 'triangle' : 'sawtooth';
  osc.frequency.setValueAtTime(freq, t);
  if (positive) osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.15);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.32);
}

/** Soft "pop" for taps. */
export function playPop(): void {
  if (!ctx || !masterGain) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.14);
}

/** Calm "whoosh" for breathing. */
export function playWhoosh(inhale: boolean): void {
  if (!ctx || !masterGain) return;
  const t = ctx.currentTime;
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.4;
  }
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(inhale ? 400 : 300, t);
  filter.frequency.linearRampToValueAtTime(inhale ? 900 : 200, t + 1.0);
  filter.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.18, t + 0.2);
  g.gain.linearRampToValueAtTime(0.0001, t + 1.1);
  noise.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  noise.start(t);
  noise.stop(t + 1.2);
}

export function isMusicPlaying(): boolean {
  return isPlaying;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (masterGain && ctx) masterGain.gain.setValueAtTime(enabled ? 0.9 : 0, ctx.currentTime);
}
