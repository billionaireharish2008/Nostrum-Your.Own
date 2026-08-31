let ctx = null;

const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  return ctx;
};

export const playTone = (freq = 660, duration = 0.12, type = "sine", gain = 0.05) => {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration + 0.02);
};

export const playOpen = () => {
  playTone(523, 0.1, "sine", 0.05);
  setTimeout(() => playTone(784, 0.12, "sine", 0.05), 80);
};

export const playClose = () => {
  playTone(440, 0.1, "sine", 0.04);
};

export const playSend = () => {
  playTone(880, 0.08, "triangle", 0.05);
};

export const playReceive = () => {
  playTone(659, 0.1, "sine", 0.05);
  setTimeout(() => playTone(988, 0.12, "sine", 0.04), 90);
};