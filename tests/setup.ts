import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); });

// Browser audio is the system boundary; game logic and persistence stay real.
const audioParam = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} });
const audioNode = () => ({ connect() {}, start() {}, stop() {}, gain: audioParam(), frequency: audioParam(), Q: audioParam() });
class TestAudioContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  createGain = audioNode;
  createOscillator = audioNode;
  createBiquadFilter = audioNode;
  createBufferSource = audioNode;
  createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
  resume() { return Promise.resolve(); }
}
vi.stubGlobal('AudioContext', TestAudioContext);
