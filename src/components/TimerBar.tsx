"use client";

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  questionNumber: number;
  totalQuestions: number;
}

export default function TimerBar({ timeRemaining, totalTime, questionNumber, totalQuestions }: TimerBarProps) {
  const fraction = timeRemaining / totalTime;
  const isUrgent = timeRemaining <= 3;
  const isCritical = timeRemaining <= 1.5;

  const barColor = isCritical
    ? "var(--wrong)"
    : isUrgent
      ? "var(--accent-glow)"
      : "var(--green-glow)";

  const glowColor = isCritical
    ? "rgba(255, 68, 68, 0.4)"
    : isUrgent
      ? "rgba(255, 230, 0, 0.4)"
      : "rgba(57, 255, 20, 0.3)";

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-arcade">
        <div
          className="h-full rounded-full"
          style={{
            width: `${fraction * 100}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 8px ${glowColor}`,
            transition: "width 50ms linear, background-color 300ms ease",
          }}
        />
      </div>
      <span className="font-[family-name:var(--font-press-start)] text-[10px] text-text-secondary whitespace-nowrap tabular-nums">
        {questionNumber}/{totalQuestions}
      </span>
    </div>
  );
}
