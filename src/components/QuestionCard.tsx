"use client";

interface QuestionCardProps {
  question: string;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="arcade-panel rounded-lg p-6">
      <p className="text-xl font-bold text-text-primary leading-relaxed">
        {question}
      </p>
    </div>
  );
}
