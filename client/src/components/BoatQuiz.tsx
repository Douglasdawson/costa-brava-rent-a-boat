import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Users, Clock, Wallet, Anchor, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { trackBlogCtaClick, trackBoatQuizStart, trackBoatQuizComplete } from "@/utils/analytics";

interface QuizAnswer {
  passengers: number | null;
  duration: string | null;
  budget: string | null;
}

interface BoatRecommendation {
  id: string;
  name: string;
  reason: string;
  score: number;
}

const BOAT_PROFILES = [
  { id: "astec-400", name: "Astec 400", capacity: 4, license: false, budget: "low", duration: "short", group: "couple", price: 70 },
  { id: "solar-450", name: "Solar 450", capacity: 5, license: false, budget: "low", duration: "medium", group: "family", price: 80 },
  { id: "remus-450", name: "Remus 450", capacity: 5, license: false, budget: "low", duration: "short", group: "family", price: 80 },
  { id: "astec-480", name: "Astec 480", capacity: 5, license: false, budget: "medium", duration: "long", group: "premium", price: 90 },
  { id: "voraz-v2", name: "Voraz V2", capacity: 5, license: false, budget: "medium", duration: "medium", group: "family", price: 85 },
  { id: "mingolla-brava-19", name: "Mingolla Brava 19", capacity: 6, license: true, budget: "high", duration: "long", group: "adventure", price: 200 },
  { id: "trimarchi-57s", name: "Trimarchi 57S", capacity: 7, license: true, budget: "high", duration: "long", group: "group", price: 250 },
  { id: "pacific-craft-625", name: "Pacific Craft 625", capacity: 7, license: true, budget: "high", duration: "long", group: "group", price: 350 },
];

function scoreBoat(boat: typeof BOAT_PROFILES[0], answers: QuizAnswer): number {
  let score = 0;
  const passengers = answers.passengers || 2;

  // Capacity fit
  if (passengers <= boat.capacity) score += 3;
  if (passengers === boat.capacity) score += 2;
  if (passengers > boat.capacity) score -= 10;

  // Duration preference
  if (answers.duration === "short" && (boat.duration === "short" || boat.duration === "medium")) score += 2;
  if (answers.duration === "medium") score += 2;
  if (answers.duration === "long" && boat.duration === "long") score += 3;

  // Budget match
  if (answers.budget === "low" && boat.budget === "low") score += 3;
  if (answers.budget === "medium" && (boat.budget === "low" || boat.budget === "medium")) score += 2;
  if (answers.budget === "high") score += 1;

  // Prefer no-license boats for simplicity
  if (!boat.license) score += 1;

  return score;
}

export default function BoatQuiz({ source = "page", onBoatSelect }: { source?: string; onBoatSelect?: (boatId: string) => void }) {
  const { localizedPath } = useLanguage();
  const tBase = useTranslations();
  const t = tBase.boatQuiz;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({ passengers: null, duration: null, budget: null });

  const handleAnswer = (value: string | number) => {
    if (step === 0) {
      trackBoatQuizStart(source);
      const passengerMap = [2, 4, 5, 6];
      setAnswers(prev => ({ ...prev, passengers: passengerMap[value as number] }));
    } else if (step === 1) {
      const durationMap = ["short", "medium", "long"];
      setAnswers(prev => ({ ...prev, duration: durationMap[value as number] }));
    } else if (step === 2) {
      const budgetMap = ["low", "medium", "high"];
      setAnswers(prev => ({ ...prev, budget: budgetMap[value as number] }));
    }
    setStep(prev => prev + 1);
  };

  const reset = () => {
    setStep(0);
    setAnswers({ passengers: null, duration: null, budget: null });
  };

  const recommendations: BoatRecommendation[] = useMemo(() => {
    return BOAT_PROFILES
      .map(boat => ({
        id: boat.id,
        name: boat.name,
        reason: t?.reasons?.[boat.id] ?? "",
        score: scoreBoat(boat, answers),
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [answers, t]);

  useEffect(() => {
    if (step === 3 && recommendations.length > 0) {
      const topResult = recommendations[0];
      trackBoatQuizComplete(topResult?.name || 'unknown');
      // Store quiz result for session-aware exit intent
      if (topResult) {
        try {
          sessionStorage.setItem("cbrb_quizResult", JSON.stringify({
            boatId: topResult.id,
            boatName: topResult.name,
          }));
        } catch { /* sessionStorage unavailable */ }
      }
    }
  }, [step, recommendations]);

  if (!t) return null;

  // Quiz questions UI
  if (step < 3) {
    const questions = [
      { icon: Users, question: t.q1, options: t.q1options },
      { icon: Clock, question: t.q2, options: t.q2options },
      { icon: Wallet, question: t.q3, options: t.q3options },
    ];
    const current = questions[step];
    const Icon = current.icon;

    return (
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <Anchor className="w-8 h-8 text-cta mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-heading text-xl font-bold">{t.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Progress */}
        <div
          className="flex gap-1.5 mb-6"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`${t.title} — ${step + 1} / 3`}
        >
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-cta' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="text-center mb-5">
          <Icon className="w-6 h-6 text-cta mx-auto mb-2" aria-hidden="true" />
          <p className="font-medium text-lg" id={`quiz-question-${step}`}>{current.question}</p>
        </div>

        <div className="grid gap-3" role="radiogroup" aria-labelledby={`quiz-question-${step}`}>
          {current.options.map((option, idx) => (
            <button
              key={idx}
              role="radio"
              aria-checked={false}
              onClick={() => handleAnswer(idx)}
              className="w-full text-left px-5 py-3.5 rounded-xl border border-border hover:border-cta hover:bg-cta/5 transition-all text-sm font-medium flex items-center justify-between group min-h-11"
            >
              {option}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cta transition-colors" aria-hidden="true" />
            </button>
          ))}
        </div>

        {step > 0 && (
          <button
            onClick={() => setStep(prev => prev - 1)}
            className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto min-h-11 px-3"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            {t.back}
          </button>
        )}
      </div>
    );
  }

  // Results UI
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="text-center mb-6">
        <Anchor className="w-8 h-8 text-cta mx-auto mb-3" aria-hidden="true" />
        <h3 className="font-heading text-xl font-bold">{t.result}</h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.id}
            className={`rounded-xl border p-4 ${idx === 0 ? 'border-cta bg-cta/5' : 'border-border'}`}
          >
            {idx === 0 && (
              <span className="inline-block text-xs font-semibold text-cta mb-2 uppercase tracking-wider">{t.bestMatch}</span>
            )}
            {idx === 1 && recommendations.length > 1 && (
              <span className="inline-block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{t.alsoConsider}</span>
            )}
            <h4 className="font-heading font-bold text-lg">{rec.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
            <div className="flex gap-2 mt-3">
              {onBoatSelect ? (
                <button
                  onClick={() => {
                    trackBlogCtaClick(rec.id, 'boat_quiz_book');
                    onBoatSelect(rec.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-11 ${idx === 0 ? 'bg-cta text-cta-foreground hover:bg-cta/90' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'}`}
                >
                  {idx === 0 ? t.bookNow : t.viewDetails}
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              ) : (
                <Link
                  href={`${localizedPath("boatDetail", rec.id)}?utm_source=blog&utm_medium=boat_quiz&utm_campaign=${source}`}
                  onClick={() => trackBlogCtaClick(rec.id, 'boat_quiz_book')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-11 ${idx === 0 ? 'bg-cta text-cta-foreground hover:bg-cta/90' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'}`}
                >
                  {idx === 0 ? t.bookNow : t.viewDetails}
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={reset}
        className="mt-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto min-h-11 px-3"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        {t.restart}
      </button>
    </div>
  );
}
