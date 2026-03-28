import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/utils/analytics";

export type IntentScore = "low" | "medium" | "high" | "very_high";

interface BehaviorSignals {
  boatsViewed: number;
  timeOnSite: number;
  quizCompleted: boolean;
  bookingStarted: boolean;
  isReturnVisitor: boolean;
}

function readSignals(startTime: number): BehaviorSignals {
  let boatsViewed = 0;
  let quizCompleted = false;
  let bookingStarted = false;
  let isReturnVisitor = false;

  try {
    boatsViewed = parseInt(sessionStorage.getItem("cbrb_boatsViewed") || "0", 10);
    if (isNaN(boatsViewed)) boatsViewed = 0;
  } catch { /* storage unavailable */ }

  try {
    quizCompleted = sessionStorage.getItem("cbrb_quizResult") !== null;
  } catch { /* storage unavailable */ }

  try {
    bookingStarted = sessionStorage.getItem("cbrb_bookingStarted") !== null;
  } catch { /* storage unavailable */ }

  try {
    const lastVisit = localStorage.getItem("cbrb_lastVisit");
    if (lastVisit) {
      const gap = Date.now() - parseInt(lastVisit, 10);
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const FOURTEEN_DAYS_MS = 14 * ONE_DAY_MS;
      isReturnVisitor = gap >= ONE_DAY_MS && gap <= FOURTEEN_DAYS_MS;
    }
  } catch { /* storage unavailable */ }

  const timeOnSite = Math.floor((Date.now() - startTime) / 1000);

  return { boatsViewed, timeOnSite, quizCompleted, bookingStarted, isReturnVisitor };
}

function calculateIntentScore(signals: BehaviorSignals): IntentScore {
  const { boatsViewed, timeOnSite, quizCompleted, bookingStarted, isReturnVisitor } = signals;

  // very_high: strong commitment signals
  if (isReturnVisitor || bookingStarted || quizCompleted) {
    return "very_high";
  }

  // high: significant engagement
  if (boatsViewed >= 3 && timeOnSite >= 60) {
    return "high";
  }

  // medium: some engagement
  if (timeOnSite >= 30 || boatsViewed >= 1) {
    return "medium";
  }

  return "low";
}

const REFRESH_INTERVAL_MS = 10_000;

/**
 * Collects behavioral signals from sessionStorage/localStorage
 * and calculates an intent score. Re-evaluates every 10 seconds.
 */
export function useBehaviorSignals(): { intentScore: IntentScore } {
  const startTimeRef = useRef(Date.now());
  const trackedRef = useRef(false);
  const [intentScore, setIntentScore] = useState<IntentScore>(() => {
    const signals = readSignals(startTimeRef.current);
    return calculateIntentScore(signals);
  });

  useEffect(() => {
    function evaluate() {
      const signals = readSignals(startTimeRef.current);
      const score = calculateIntentScore(signals);
      setIntentScore(score);

      // Track once when score first reaches high or very_high
      if (!trackedRef.current && (score === "high" || score === "very_high")) {
        trackedRef.current = true;
        trackEvent("intent_score_calculated", {
          score,
          boats_viewed: signals.boatsViewed,
          time_on_site: signals.timeOnSite,
          quiz_completed: signals.quizCompleted,
          booking_started: signals.bookingStarted,
          is_return_visitor: signals.isReturnVisitor,
        });
      }
    }

    // Initial evaluation
    evaluate();

    const intervalId = setInterval(evaluate, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return { intentScore };
}
