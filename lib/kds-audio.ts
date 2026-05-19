"use client";

// Lightweight audio cues for the KDS. Uses Web Audio API to synthesize five
// distinct tones — no mp3 assets needed, works in Chrome kiosk on Android.
// Each cue is short (<400ms) so it doesn't pile up during a slam.

let ctx: AudioContext | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext) as typeof AudioContext;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(m: boolean): void {
  muted = m;
}
export function isMuted(): boolean {
  return muted;
}

type Tone = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

function playSequence(tones: Tone[]): void {
  const c = ensureCtx();
  if (!c || muted) return;
  if (c.state === "suspended") {
    // Resume on the first user gesture. iOS/Chrome require this.
    c.resume().catch(() => {});
  }
  let t = c.currentTime;
  for (const tone of tones) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, t);
    const peak = tone.gain ?? 0.18;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + tone.duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + tone.duration + 0.02);
    t += tone.duration;
  }
}

export const cues = {
  newOrder() {
    playSequence([
      { freq: 660, duration: 0.12, type: "sine" },
      { freq: 880, duration: 0.18, type: "sine" },
    ]);
  },
  newAllergen() {
    // Three quick descending tones — distinct from the calm "new order".
    playSequence([
      { freq: 880, duration: 0.1, type: "triangle", gain: 0.22 },
      { freq: 660, duration: 0.1, type: "triangle", gain: 0.22 },
      { freq: 440, duration: 0.16, type: "triangle", gain: 0.22 },
    ]);
  },
  void() {
    playSequence([
      { freq: 220, duration: 0.18, type: "square", gain: 0.12 },
    ]);
  },
  serverAsk() {
    playSequence([
      { freq: 520, duration: 0.08, type: "sine" },
      { freq: 520, duration: 0.08, type: "sine" },
    ]);
  },
  bumpConfirm() {
    playSequence([
      { freq: 980, duration: 0.08, type: "sine", gain: 0.14 },
    ]);
  },
} as const;
