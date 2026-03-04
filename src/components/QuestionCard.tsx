"use client";

interface QuestionCardProps {
  question: string;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-light/30">
      <p className="text-lg font-semibold text-text-primary leading-relaxed">
        {question}
      </p>
    </div>
  );
}
