"use client";

interface QuestionCardProps {
  question: string;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="arcade-panel rounded-lg p-5">
      <p className="text-lg font-semibold text-text-primary leading-relaxed">
        {question}
      </p>
    </div>
  );
}
