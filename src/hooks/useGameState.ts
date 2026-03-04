"use client";

import { useState, useCallback, useRef } from "react";
import { calculateScore } from "@/lib/scoring";

export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export type GamePhase = "start" | "countdown" | "playing" | "feedback" | "results";

export interface GameState {
  phase: GamePhase;
  questions: GameQuestion[];
  currentQuestionIndex: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  gameStartTime: number;
  gameEndTime: number;
}

const initialState: GameState = {
  phase: "start",
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  selectedAnswer: null,
  isCorrect: null,
  pointsEarned: 0,
  gameStartTime: 0,
  gameEndTime: 0,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = useCallback(async (questionCount: 5 | 10) => {
    setState((s) => ({ ...s, phase: "countdown", totalQuestions: questionCount }));

    try {
      const res = await fetch(`/api/questions?count=${questionCount}`);
      const data = await res.json();

      setState((s) => ({
        ...s,
        questions: data.questions,
      }));
    } catch {
      // Use an empty array - game will show error
      setState((s) => ({ ...s, questions: [] }));
    }
  }, []);

  const beginPlay = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: "playing",
      currentQuestionIndex: 0,
      score: 0,
      correctAnswers: 0,
      selectedAnswer: null,
      isCorrect: null,
      pointsEarned: 0,
      gameStartTime: Date.now(),
    }));
  }, []);

  const answerQuestion = useCallback(
    (answerIndex: number, timeRemaining: number) => {
      setState((s) => {
        if (s.selectedAnswer !== null) return s; // prevent double-tap

        const question = s.questions[s.currentQuestionIndex];
        const correct = answerIndex === question.correctIndex;
        const points = correct ? calculateScore(timeRemaining) : 0;

        return {
          ...s,
          phase: "feedback",
          selectedAnswer: answerIndex,
          isCorrect: correct,
          pointsEarned: points,
          score: s.score + points,
          correctAnswers: s.correctAnswers + (correct ? 1 : 0),
        };
      });
    },
    []
  );

  const timeUp = useCallback(() => {
    setState((s) => {
      if (s.selectedAnswer !== null) return s;
      return {
        ...s,
        phase: "feedback",
        selectedAnswer: -1, // no answer
        isCorrect: false,
        pointsEarned: 0,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

    setState((s) => {
      const nextIndex = s.currentQuestionIndex + 1;
      if (nextIndex >= s.questions.length) {
        return { ...s, phase: "results", gameEndTime: Date.now() };
      }
      return {
        ...s,
        phase: "playing",
        currentQuestionIndex: nextIndex,
        selectedAnswer: null,
        isCorrect: null,
        pointsEarned: 0,
      };
    });
  }, []);

  const reset = useCallback(() => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setState(initialState);
  }, []);

  const currentQuestion = state.questions[state.currentQuestionIndex] || null;

  return {
    state,
    currentQuestion,
    startGame,
    beginPlay,
    answerQuestion,
    timeUp,
    nextQuestion,
    reset,
  };
}
