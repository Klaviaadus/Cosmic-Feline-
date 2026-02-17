// Simple synthesized sound effects using the Web Audio API.
// Each function creates a short tone or noise burst — no audio files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export function playFeedSound() {
  playTone(523, 0.12); // C5
  setTimeout(() => playTone(659, 0.12), 100); // E5
  setTimeout(() => playTone(784, 0.15), 200); // G5
}

export function playPlaySound() {
  playTone(440, 0.08, 'square', 0.1);
  setTimeout(() => playTone(554, 0.08, 'square', 0.1), 80);
  setTimeout(() => playTone(659, 0.08, 'square', 0.1), 160);
  setTimeout(() => playTone(880, 0.15, 'square', 0.1), 240);
}

export function playPetSound() {
  playTone(600, 0.2, 'sine', 0.08);
}

export function playLevelUpSound() {
  playTone(523, 0.15);
  setTimeout(() => playTone(659, 0.15), 120);
  setTimeout(() => playTone(784, 0.15), 240);
  setTimeout(() => playTone(1047, 0.3), 360);
}

export function playBuySound() {
  playTone(880, 0.1, 'triangle', 0.12);
  setTimeout(() => playTone(1100, 0.15, 'triangle', 0.12), 100);
}

export function playAchievementSound() {
  playTone(784, 0.15);
  setTimeout(() => playTone(988, 0.15), 150);
  setTimeout(() => playTone(1175, 0.3), 300);
}
