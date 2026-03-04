"use client";

const ACCENT_COLORS = [
  "var(--green-primary)",
  "var(--accent)",
  "var(--green-light)",
  "var(--brown-warm)",
];

const LABELS = ["A", "B", "C", "D"];

interface AnswerButtonProps {
  index: number;
  text: string;
  onSelect: () => void;
  disabled: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
}

export default function AnswerButton({
  index,
  text,
  onSelect,
  disabled,
  isSelected,
  isCorrect,
  showResult,
}: AnswerButtonProps) {
  let bgClass = "bg-white";
  let borderColor = ACCENT_COLORS[index];

  if (showResult) {
    if (isCorrect) {
      bgClass = "bg-correct/20";
      borderColor = "var(--correct)";
    } else if (isSelected) {
      bgClass = "bg-wrong/20";
      borderColor = "var(--wrong)";
    }
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        w-full min-h-[56px] px-4 py-3 rounded-xl text-left
        font-medium text-text-primary text-base
        border-l-4 border-solid
        transition-all duration-100 ease-out
        ${bgClass}
        ${!disabled ? "active:scale-[0.97] hover:bg-bg-secondary" : ""}
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
      style={{
        borderLeftColor: borderColor,
        touchAction: "manipulation",
      }}
    >
      <span className="flex items-center gap-3">
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: borderColor }}
        >
          {LABELS[index]}
        </span>
        <span className="flex-1">{text}</span>
        {showResult && isCorrect && <span className="text-correct text-xl">&#10003;</span>}
        {showResult && isSelected && !isCorrect && <span className="text-wrong text-xl">&#10007;</span>}
      </span>
    </button>
  );
}
