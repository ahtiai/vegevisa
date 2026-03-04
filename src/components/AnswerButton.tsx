"use client";

const ACCENT_COLORS = [
  "var(--green-glow)",
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
  let borderColor = ACCENT_COLORS[index];
  let bgStyle = "var(--bg-panel)";
  let glowStyle = "none";

  if (showResult) {
    if (isCorrect) {
      borderColor = "var(--correct)";
      bgStyle = "rgba(57, 255, 20, 0.1)";
      glowStyle = "0 0 15px rgba(57, 255, 20, 0.3)";
    } else if (isSelected) {
      borderColor = "var(--wrong)";
      bgStyle = "rgba(255, 68, 68, 0.1)";
      glowStyle = "0 0 15px rgba(255, 68, 68, 0.3)";
    }
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        w-full min-h-[56px] px-4 py-3 rounded-lg text-left
        font-semibold text-text-primary text-base
        border-2 border-solid
        transition-all duration-100 ease-out
        ${!disabled ? "active:scale-[0.97]" : ""}
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
      style={{
        borderColor,
        borderLeftWidth: "4px",
        background: bgStyle,
        boxShadow: glowStyle,
        touchAction: "manipulation",
      }}
    >
      <span className="flex items-center gap-3">
        <span
          className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center font-[family-name:var(--font-press-start)] text-[9px] text-bg-primary font-bold"
          style={{ backgroundColor: borderColor }}
        >
          {LABELS[index]}
        </span>
        <span className="flex-1">{text}</span>
        {showResult && isCorrect && (
          <span className="text-correct text-xl glow-green">&#10003;</span>
        )}
        {showResult && isSelected && !isCorrect && (
          <span className="text-wrong text-xl">&#10007;</span>
        )}
      </span>
    </button>
  );
}
