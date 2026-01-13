"use client";

interface TurnTimerProps {
  timeRemaining: number | null;
  maxTime: number;
  isActive: boolean;
}

export function TurnTimer({ timeRemaining, maxTime, isActive }: TurnTimerProps) {
  const percentage = timeRemaining ? (timeRemaining / maxTime) * 100 : 0;
  const isUrgent = timeRemaining !== null && timeRemaining <= 5;
  const pulseClass = isUrgent ? "motion-safe:animate-pulse" : "";

  if (!isActive || timeRemaining === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      {/* Circular Timer */}
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isUrgent ? "#EF4444" : "#10B981"}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className={`transition-all duration-200 ${pulseClass}`}
            style={{
              filter: isUrgent ? "drop-shadow(0 0 8px #EF4444)" : "none",
            }}
          />
        </svg>

        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-2xl font-bold transition-colors duration-200 ${
              isUrgent ? "text-red-500" : "text-white"
            }`}
          >
            {timeRemaining}
          </span>
        </div>
      </div>

      {/* Warning text */}
      {isUrgent && (
        <div
          className={`text-red-500 text-sm font-semibold transition-opacity duration-200 ${pulseClass}`}
        >
          Time running out!
        </div>
      )}
    </div>
  );
}
