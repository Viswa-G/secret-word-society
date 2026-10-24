import { useState } from "react";
import { X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { sounds } from "@/lib/sounds";
import { formatDuration } from "@/lib/utils";

interface TimerModalProps {
  onClose: () => void;
  initialDuration: number;
  initialEnabled?: boolean;
  onSave: (duration: number, enabled: boolean) => void;
  showToggle?: boolean;
  title?: string;
}

export function TimerModal({
  onClose,
  initialDuration,
  initialEnabled = true,
  onSave,
  showToggle = true,
  title = "Set Timer Duration",
}: TimerModalProps) {
  const [duration, setDuration] = useState(initialDuration || 90);
  const [enabled, setEnabled] = useState(initialEnabled);

  const handleConfirm = () => {
    sounds.playTap();
    onSave(duration, enabled);
    onClose();
  };

  const PRESETS = [
    { label: "1 min", secs: 60 },
    { label: "2 min", secs: 120 },
    { label: "3 min", secs: 180 },
    { label: "5 min", secs: 300 },
    { label: "10 min", secs: 600 },
    { label: "15 min", secs: 900 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-card rounded-3xl p-5 card-shadow border-2 border-foreground space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div>
            <span className="text-[10px] font-black tracking-widest text-pink uppercase block">
              DISCUSSION TIMER
            </span>
            <h3 className="font-display text-xl font-black text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Enable / Disable toggle row */}
        {showToggle && (
          <div className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3.5 border border-border/60">
            <div>
              <p className="font-display font-extrabold text-sm text-foreground">Timer Enabled</p>
              <p className="text-xs text-muted-foreground font-semibold">
                {enabled ? "Countdown during discussion" : "Untimed discussion"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setEnabled(!enabled);
              }}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                enabled ? "bg-pink" : "bg-muted-foreground/30"
              }`}
              role="switch"
              aria-checked={enabled}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  enabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        )}

        {/* If enabled, display duration, slider, presets */}
        {enabled && (
          <div className="space-y-3.5 py-1">
            {/* Big Duration Display Badge */}
            <div className="text-center rounded-2xl bg-pink/10 border-2 border-pink/30 py-3 px-4">
              <span className="text-[10px] font-extrabold tracking-widest text-pink uppercase block">
                SELECTED TIME
              </span>
              <p className="font-display text-3xl font-black text-foreground mt-0.5">
                ⏱️ {formatDuration(duration)}
              </p>
            </div>

            {/* Custom Slider */}
            <div className="px-1 py-1">
              <Slider
                min={30}
                max={1200}
                step={15}
                value={[duration]}
                onValueChange={([val]) => setDuration(val)}
                className="cursor-pointer py-1"
              />
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground/75 mt-1.5 px-0.5 select-none">
                <span>30s</span>
                <span>5m</span>
                <span>10m</span>
                <span>15m</span>
                <span>20m</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                Quick Presets:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.secs}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setDuration(preset.secs);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-extrabold transition active:scale-95 cursor-pointer text-center ${
                      duration === preset.secs
                        ? "bg-pink text-white card-shadow scale-102"
                        : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full rounded-2xl bg-lime py-4 font-display font-black text-foreground btn-3d text-base flex items-center justify-center gap-2 mt-2"
        >
          CONFIRM &amp; SET TIMER
        </button>
      </div>
    </div>
  );
}
