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

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-colors duration-300"
          style={{
            width: `${fraction * 100}%`,
            backgroundColor: isCritical
              ? "var(--wrong)"
              : isUrgent
                ? "var(--accent)"
                : "var(--green-primary)",
            transition: "width 50ms linear, background-color 300ms ease",
          }}
        />
      </div>
      <span className="text-sm font-semibold text-text-secondary whitespace-nowrap tabular-nums">
        {questionNumber}/{totalQuestions}
      </span>
    </div>
  );
}
