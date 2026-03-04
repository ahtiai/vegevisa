"use client";

import { useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useTimer } from "@/hooks/useTimer";
import { useSound } from "@/hooks/useSound";
import Countdown from "@/components/Countdown";
import QuestionCard from "@/components/QuestionCard";
import AnswerButton from "@/components/AnswerButton";
import TimerBar from "@/components/TimerBar";
import SoundToggle from "@/components/SoundToggle";

function PlayGame() {
  const searchParams = useSearchParams();
  const count = (parseInt(searchParams.get("count") || "10") === 5 ? 5 : 10) as 5 | 10;

  const { state, currentQuestion, startGame, beginPlay, answerQuestion, timeUp, nextQuestion } =
    useGameState();
  const { play, isMuted, toggleMute, initSounds, stopBgMusic } = useSound();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTimeUp = useCallback(() => {
    timeUp();
    play("wrong");
  }, [timeUp, play]);

  const { timeRemaining, start: startTimer, stop: stopTimer, totalTime } = useTimer(handleTimeUp);

  useEffect(() => {
    startGame(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.phase === "playing" && currentQuestion) {
      startTimer();
    }
    if (state.phase === "feedback") {
      stopTimer();
      feedbackTimerRef.current = setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.currentQuestionIndex]);

  useEffect(() => {
    if (state.phase === "results") {
      stopBgMusic();
      play("gameover");

      const params = new URLSearchParams({
        score: String(state.score),
        correct: String(state.correctAnswers),
        total: String(state.totalQuestions),
        time: String(Math.round((state.gameEndTime - state.gameStartTime) / 1000)),
      });
      window.location.href = `/results?${params.toString()}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleAnswer = (index: number) => {
    if (state.phase !== "playing") return;
    initSounds();
    answerQuestion(index, timeRemaining);
    const question = currentQuestion!;
    if (index === question.correctIndex) {
      play("correct");
    } else {
      play("wrong");
    }
  };

  const handleCountdownComplete = useCallback(() => {
    initSounds();
    play("countdown");
    beginPlay();
    play("bgMusic");
  }, [beginPlay, play, initSounds]);

  useEffect(() => {
    if (state.phase === "playing" && timeRemaining <= 5 && timeRemaining > 0) {
      const whole = Math.ceil(timeRemaining);
      const diff = timeRemaining - (whole - 1);
      if (diff < 0.1) {
        play("tick");
      }
    }
  }, [Math.ceil(timeRemaining), state.phase, play, timeRemaining]);

  return (
    <main className="flex-1 flex flex-col px-5 py-5 max-w-lg mx-auto w-full">
      <SoundToggle isMuted={isMuted} onToggle={toggleMute} />

      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="font-[family-name:var(--font-press-start)] text-base text-green-glow glow-green">
          VEGEVISA
        </h1>
      </div>

      {state.phase === "countdown" && <Countdown onComplete={handleCountdownComplete} />}

      {(state.phase === "playing" || state.phase === "feedback") && currentQuestion && (
        <div className="flex-1 flex flex-col animate-fade-in-up">
          {/* Timer */}
          <div className="mb-5">
            <TimerBar
              timeRemaining={timeRemaining}
              totalTime={totalTime}
              questionNumber={state.currentQuestionIndex + 1}
              totalQuestions={state.totalQuestions}
            />
          </div>

          {/* Question */}
          <div className="mb-6">
            <QuestionCard question={currentQuestion.question} />
          </div>

          {/* Answer buttons */}
          <div className="space-y-3 mt-auto pb-5">
            {/* Points feedback — above first answer */}
            {state.phase === "feedback" && (
              <div className="text-center py-3">
                {state.isCorrect ? (
                  <span className="font-[family-name:var(--font-press-start)] text-base text-white bg-correct/20 border-2 border-correct rounded-lg px-5 py-2 inline-block glow-green animate-float-up">
                    OIKEIN! +{state.pointsEarned}
                  </span>
                ) : (
                  <span className="font-[family-name:var(--font-press-start)] text-base text-white bg-wrong/20 border-2 border-wrong rounded-lg px-5 py-2 inline-block">
                    {state.selectedAnswer === -1 ? "AIKA LOPPUI!" : "VÄÄRIN!"}
                  </span>
                )}
              </div>
            )}
            {currentQuestion.options.map((option, i) => (
              <AnswerButton
                key={`${state.currentQuestionIndex}-${i}`}
                index={i}
                text={option}
                onSelect={() => handleAnswer(i)}
                disabled={state.phase === "feedback"}
                isSelected={state.selectedAnswer === i}
                isCorrect={i === currentQuestion.correctIndex}
                showResult={state.phase === "feedback"}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="font-[family-name:var(--font-press-start)] text-sm text-green-glow glow-green animate-blink">
            LADATAAN...
          </div>
        </div>
      }
    >
      <PlayGame />
    </Suspense>
  );
}
