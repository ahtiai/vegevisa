const BASE_POINTS = 1000;
const MAX_BONUS = 1000;

export function calculateScore(
  timeRemaining: number,
  totalTime: number,
): number {
  const fraction =
    Number.isFinite(timeRemaining) && totalTime > 0
      ? Math.max(0, Math.min(1, timeRemaining / totalTime))
      : 0;
  const bonus = Math.round(MAX_BONUS * fraction);
  return BASE_POINTS + bonus;
}

export function getMaxScore(totalQuestions: number): number {
  return totalQuestions * (BASE_POINTS + MAX_BONUS);
}

export function getScorePercentage(
  score: number,
  totalQuestions: number,
): number {
  return (score / getMaxScore(totalQuestions)) * 100;
}

export interface RankTitle {
  title: string;
  emoji: string;
}

export function getRankTitle(percentage: number): RankTitle {
  if (percentage >= 90) return { title: "Kasvismestari", emoji: "🌿" };
  if (percentage >= 70) return { title: "Kasvitietäjä", emoji: "🌱" };
  if (percentage >= 50) return { title: "Kasviskaveri", emoji: "🌻" };
  if (percentage >= 25) return { title: "Utelias maistelija", emoji: "🌾" };
  return { title: "Rohkea kokeilija", emoji: "🥕" };
}
