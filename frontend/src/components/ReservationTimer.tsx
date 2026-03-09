import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

interface ReservationTimerProps {
  seconds: number;
  onExpire?: () => void;
  active?: boolean;
}

export function ReservationTimer({ seconds, onExpire, active = true }: ReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (!active) return;
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, active, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isWarning = timeLeft < 60;

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
      isWarning ? "border-primary/50 text-primary animate-pulse" : "border-border text-muted-foreground"
    }`}>
      <Timer className="h-4 w-4" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      <span className="text-xs">para completar</span>
    </div>
  );
}
