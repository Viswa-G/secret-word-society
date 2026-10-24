// Web Audio API Sound Effects Manager for Secret Word Society
// 100% offline, zero external asset dependencies, zero network latency
import { haptics } from "./haptics";

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private unlocked: boolean = false;
  private listenersAttached: boolean = false;
  private readonly unlockEvents = [
    "touchstart",
    "touchend",
    "pointerdown",
    "click",
    "keydown",
  ] as const;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sws_sound_muted");
      this.muted = saved === "true";
      this.attachUnlockListeners();
      this.attachVisibilityListener();
    }
  }

  private handleUnlock = () => {
    this.unlockAudio();
  };

  private attachUnlockListeners() {
    if (typeof window === "undefined" || this.listenersAttached || this.unlocked) return;
    this.listenersAttached = true;
    this.unlockEvents.forEach((event) => {
      window.addEventListener(event, this.handleUnlock, { capture: true, passive: true });
    });
  }

  private removeUnlockListeners() {
    if (typeof window === "undefined" || !this.listenersAttached) return;
    this.unlockEvents.forEach((event) => {
      window.removeEventListener(event, this.handleUnlock, { capture: true });
    });
    this.listenersAttached = false;
  }

  private attachVisibilityListener() {
    if (typeof document === "undefined") return;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    });
  }

  public unlockAudio() {
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (!this.unlocked) {
      try {
        // Play 1 silent sample to completely satisfy iOS Safari Web Audio autoplay restrictions
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.unlocked = true;
        this.removeUnlockListeners();
      } catch (_err) {
        // Keep listeners attached if playback failed so next interaction retries
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("sws_sound_muted", muted ? "true" : "false");
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // 1. Smooth card flip whoosh sound
  public playCardFlip() {
    haptics.cardFlip();
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.15);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (_err) {
      // Audio autoplay policy fallback
    }
  }

  // 2. Soft wooden tick for countdown
  public playTick() {
    haptics.tick();
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (_err) {
      // Audio autoplay policy fallback
    }
  }

  // 3. Time's up chime / buzzer
  public playBuzzer() {
    haptics.buzzer();
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { freq: 520, start: 0, dur: 0.15 },
        { freq: 440, start: 0.18, dur: 0.25 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.12, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (_err) {
      // Audio autoplay policy fallback
    }
  }

  // 4. Tension-building suspense drumroll
  public playDrumroll() {
    haptics.drumroll();
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const time = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140 + i * 15, time);

        gain.gain.setValueAtTime(0.08 + i * 0.015, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.07);
      }
    } catch (_err) {
      // Audio autoplay policy fallback
    }
  }

  // 5. Victory Fanfare (Major Arpeggio C5 -> E5 -> G5 -> C6)
  public playVictory() {
    haptics.victory();
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.1;
        const dur = idx === notes.length - 1 ? 0.45 : 0.15;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (_err) {
      // Audio autoplay policy fallback
    }
  }

  // 6. Defeat / Imposter Escape (Dramatic Minor Chord F4 -> Eb4 -> D4 -> C4)
  public playDefeat() {
    haptics.defeat();
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [349.23, 311.13, 293.66, 261.63]; // F4, Eb4, D4, C4
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.12;
        const dur = idx === notes.length - 1 ? 0.4 : 0.16;

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (_err) {
      // Audio autoplay policy fallback
    }
  }

  // 7. General UI tap / button click
  public playTap() {
    haptics.tap();
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (_err) {
      // Audio autoplay policy fallback
    }
  }
}

export const sounds = new SoundManager();
