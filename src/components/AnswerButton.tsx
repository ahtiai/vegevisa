"use client";

const ACCENT_COLORS = [
  "var(--green-glow)",
  "var(--accent)",
  "var(--green-light)",
  "var(--green-teal)",
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
  let borderColor = "var(--border-bright)";
  let leftColor = ACCENT_COLORS[index];
  let bgStyle = "rgba(14, 30, 14, 0.94)";
  let glowStyle = "none";

  if (showResult) {
    if (isCorrect) {
      borderColor = "var(--correct)";
      leftColor = "var(--correct)";
      bgStyle = "rgba(57, 255, 20, 0.12)";
      glowStyle = "0 0 20px rgba(57, 255, 20, 0.35)";
    } else if (isSelected) {
      borderColor = "var(--wrong)";
      leftColor = "var(--wrong)";
      bgStyle = "rgba(255, 68, 68, 0.12)";
      glowStyle = "0 0 20px rgba(255, 68, 68, 0.35)";
    }
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        w-full min-h-[64px] px-5 py-4 rounded-lg text-left
        font-bold text-text-primary text-lg
        border-3 border-solid
        transition-all duration-100 ease-out
        ${!disabled ? "active:scale-[0.97] hover:border-green-glow" : ""}
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
      style={{
        borderColor,
        borderLeftWidth: "6px",
        borderLeftColor: leftColor,
        background: bgStyle,
        boxShadow: glowStyle,
        touchAction: "manipulation",
      }}
    >
      <span className="flex items-center gap-4">
        <span
          className="flex-shrink-0 w-9 h-9 rounded flex items-center justify-center font-[family-name:var(--font-press-start)] text-[10px] text-bg-primary font-bold"
          style={{ backgroundColor: leftColor }}
        >
          {LABELS[index]}
        </span>
        <span className="flex-1">{text}</span>
        {showResult && isCorrect && (
          <span className="text-correct text-2xl glow-green font-bold">&#10003;</span>
        )}
        {showResult && isSelected && !isCorrect && (
          <span className="text-wrong text-2xl font-bold">&#10007;</span>
        )}
      </span>
    </button>
  );
}
