export interface QuestionInput {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  active: boolean;
  difficulty: string | null;
}
export interface Question extends QuestionInput {
  id: string;
  revision: number;
}
export interface SettingsInput {
  questionCounts: [number, number];
  questionTimeSeconds: number;
}
export interface QuizSettings extends SettingsInput {
  revision: number;
}
export interface ScoreInput {
  submissionId: string;
  playerName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timePlayedSeconds: number;
}
export interface LeaderboardEntry {
  player_name: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  created_at: string;
}
export interface LeaderboardData {
  allTime: LeaderboardEntry[];
  today: LeaderboardEntry[];
}
