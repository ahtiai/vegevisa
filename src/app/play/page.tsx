"use client";

import { useEffect, useCallback, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useTimer } from "@/hooks/useTimer";
import { useSound } from "@/hooks/useSound";
import Countdown from "@/components/Countdown";
import QuestionCard from "@/components/QuestionCard";
import AnswerButton from "@/components/AnswerButton";
import TimerBar from "@/components/TimerBar";

function PlayGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const count = (parseInt(searchParams.get("count") || "10") === 5 ? 5 : 10) as 5 | 10;

  const { state, currentQuestion, startGame, beginPlay, answerQuestion, timeUp, nextQuestion } =
    useGameState();
  const { play, stop, initSounds } = useSound();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const timeIsUpPlayedRef = useRef(false);

  const handleTimeUp = useCallback(() => {
    stop("timeIsUp");
    timeUp();
    play("wrong");
  }, [timeUp, play, stop]);

  const { timeRemaining, start: startTimer, stop: stopTimer, pause: pauseTimer, resume: resumeTimer, totalTime } = useTimer(handleTimeUp);

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
      const params = new URLSearchParams({
        score: String(state.score),
        correct: String(state.correctAnswers),
        total: String(state.totalQuestions),
        time: String(Math.round((state.gameEndTime - state.gameStartTime) / 1000)),
      });
      router.push(`/results?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleAnswer = (index: number) => {
    if (state.phase !== "playing") return;
    stop("timeIsUp");
    initSounds();
    answerQuestion(index, timeRemaining);
    const question = currentQuestion!;
    if (index === question.correctIndex) {
      play("correct");
    } else {
      play("wrong");
    }
  };

  const handleCountdownStart = useCallback(() => {
    initSounds();
    play("countdown");
  }, [play, initSounds]);

  const handleCountdownComplete = useCallback(() => {
    beginPlay();
  }, [beginPlay]);

  const handleQuitPress = () => {
    pauseTimer();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setShowQuitModal(true);
  };

  const handleQuitCancel = () => {
    setShowQuitModal(false);
    if (state.phase === "playing") {
      resumeTimer();
    } else if (state.phase === "feedback") {
      feedbackTimerRef.current = setTimeout(() => {
        nextQuestion();
      }, 800);
    }
  };

  const handleQuitConfirm = () => {
    stop("countdown");
    stop("timeIsUp");
    router.push("/");
  };

  // Keyboard shortcuts A/B/C/D for answers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state.phase !== "playing" || showQuitModal) return;
      const key = e.key.toLowerCase();
      const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
      if (key in map && currentQuestion && map[key] < currentQuestion.options.length) {
        handleAnswer(map[key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.phase, showQuitModal, currentQuestion]);

  // Play time-is-up sound when 5 seconds left
  useEffect(() => {
    if (state.phase !== "playing") return;
    if (timeRemaining > 5) {
      timeIsUpPlayedRef.current = false;
    } else if (timeRemaining > 0 && !timeIsUpPlayedRef.current) {
      timeIsUpPlayedRef.current = true;
      play("timeIsUp");
    }
  }, [state.phase, timeRemaining, play]);

  return (
    <main className="flex-1 flex flex-col px-5 py-5 max-w-lg mx-auto w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-8" />
        <h1 className="font-[family-name:var(--font-press-start)] text-base text-green-glow glow-green">
          VEGEVISA
        </h1>
        <button
          onClick={handleQuitPress}
          className="w-8 h-8 flex items-center justify-center rounded-md border-2 border-border-bright bg-bg-panel text-text-dim hover:text-white/70 hover:border-wrong/60 transition-colors text-xs"
          title="Lopeta peli"
          style={{ touchAction: "manipulation" }}
        >
          &#10005;
        </button>
      </div>

      {state.phase === "countdown" && <Countdown onStart={handleCountdownStart} onComplete={handleCountdownComplete} />}

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

      {/* Quit confirmation modal */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/70 backdrop-blur-sm">
          <div className="arcade-panel rounded-xl p-8 max-w-sm w-full text-center">
            <p className="text-3xl mb-4">🥕</p>
            <p className="font-[family-name:var(--font-press-start)] text-xs text-white leading-loose mb-2">
              HETKINEN!
            </p>
            <p className="text-white/80 text-base mb-8">
              Oletko varma, että haluat lopettaa? Kasvikset odottavat sinua!
            </p>
            <div className="space-y-3">
              <button
                onClick={handleQuitCancel}
                className="arcade-btn w-full h-14 rounded-lg font-[family-name:var(--font-press-start)] text-xs text-green-glow uppercase tracking-wider"
                style={{ touchAction: "manipulation" }}
              >
                Jatka peliä
              </button>
              <button
                onClick={handleQuitConfirm}
                className="w-full h-12 rounded-lg border-2 border-border-arcade bg-transparent font-[family-name:var(--font-press-start)] text-[10px] text-text-dim hover:text-wrong/80 hover:border-wrong/40 transition-colors uppercase tracking-wider"
                style={{ touchAction: "manipulation" }}
              >
                Lopeta peli
              </button>
            </div>
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
