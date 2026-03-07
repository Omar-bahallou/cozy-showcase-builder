import { useRef, useCallback } from "react";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function useGameAudio() {
  const lastComboSound = useRef(0);

  const playShoot = useCallback(() => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  const playHit = useCallback((targetType: string) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);

    const freqMap: Record<string, number> = {
      normal: 600, fast: 900, heavy: 350, bonus: 1200,
    };
    const freq = freqMap[targetType] || 600;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    // Bonus sparkle
    if (targetType === "bonus") {
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.connect(g2).connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1800, ctx.currentTime + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.15);
      g2.gain.setValueAtTime(0.1, ctx.currentTime + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.2);
    }
  }, []);

  const playCombo = useCallback((combo: number) => {
    const now = Date.now();
    if (now - lastComboSound.current < 300) return;
    lastComboSound.current = now;

    const ctx = getCtx();
    // Rising arpeggio based on combo count
    const baseFreq = 400 + Math.min(combo, 10) * 80;
    [0, 0.08, 0.16].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq + i * 200, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    });
  }, []);

  const playMiss = useCallback(() => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  const playGameOver = useCallback(() => {
    const ctx = getCtx();
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      osc.type = "square";
      const t = ctx.currentTime + i * 0.2;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }, []);

  return { playShoot, playHit, playCombo, playMiss, playGameOver };
}
