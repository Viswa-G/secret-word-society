// Mobile Haptic Vibration Helper for Secret Word Society
// Safe execution for iOS/Android mobile browsers supporting navigator.vibrate

class HapticManager {
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sws_haptics_enabled");
      this.enabled = saved !== "false";
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("sws_haptics_enabled", enabled ? "true" : "false");
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.enabled || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error on unsupported or policy-blocked browsers
    }
  }

  // 1. Subtle tap for button clicks & avatar toggles
  public tap() {
    this.vibrate(10);
  }

  // 2. Card flip tactile vibration on hold-to-reveal
  public cardFlip() {
    this.vibrate([20, 25, 20]);
  }

  // 3. Discussion countdown tick (last 5 seconds)
  public tick() {
    this.vibrate(8);
  }

  // 4. Urgent buzzer vibration when time expires
  public buzzer() {
    this.vibrate([100, 50, 150]);
  }

  // 5. Drumroll rising suspense vibration
  public drumroll() {
    this.vibrate([15, 30, 15, 30, 20, 25, 25]);
  }

  // 6. Celebratory victory pulse
  public victory() {
    this.vibrate([35, 30, 35, 30, 80]);
  }

  // 7. Defeat / Imposter escape pulse
  public defeat() {
    this.vibrate([90, 40, 140]);
  }
}

export const haptics = new HapticManager();
