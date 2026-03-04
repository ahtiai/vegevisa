const BASE_POINTS = 1000;
const MAX_BONUS = 1000;
const TOTAL_TIME = 15; // seconds

export function calculateScore(timeRemaining: number): number {
  const bonus = Math.round(MAX_BONUS * (timeRemaining / TOTAL_TIME));
  return BASE_POINTS + bonus;
}

export function getMaxScore(totalQuestions: number): number {
  return totalQuestions * (BASE_POINTS + MAX_BONUS);
}

export function getScorePercentage(score: number, totalQuestions: number): number {
  return (score / getMaxScore(totalQuestions)) * 100;
}

export interface RankTitle {
  title: string;
  emoji: string;
}

export function getRankTitle(percentage: number): RankTitle {
  if (percentage >= 90) return { title: "Kasvislegenda", emoji: "🌿" };
  if (percentage >= 70) return { title: "Vihreä mestari", emoji: "🌱" };
  if (percentage >= 50) return { title: "Lupaava kasvisharrastaja", emoji: "🌻" };
  if (percentage >= 25) return { title: "Aloitteleva vihertäjä", emoji: "🌾" };
  return { title: "Kasviskuriositeetti", emoji: "🥕" };
}
