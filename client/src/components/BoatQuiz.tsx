import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Users, Clock, Wallet, Anchor, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { trackBlogCtaClick } from "@/utils/analytics";

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

const QUIZ_TRANSLATIONS: Record<string, {
  title: string;
  subtitle: string;
  q1: string;
  q1options: string[];
  q2: string;
  q2options: string[];
  q3: string;
  q3options: string[];
  result: string;
  bestMatch: string;
  alsoConsider: string;
  bookNow: string;
  viewDetails: string;
  back: string;
  restart: string;
  people: string;
}> = {
  es: {
    title: "Encuentra tu barco ideal",
    subtitle: "Responde 3 preguntas y te recomendamos el barco perfecto",
    q1: "¿Cuántas personas sois?",
    q1options: ["2 personas", "3-4 personas", "5 personas", "6+ personas"],
    q2: "¿Cuánto tiempo quieres navegar?",
    q2options: ["1-2 horas", "3-4 horas (medio día)", "6-8 horas (día completo)"],
    q3: "¿Cuál es tu presupuesto?",
    q3options: ["Económico (desde 70€)", "Medio (100-200€)", "Sin límite"],
    result: "Tu barco ideal es...",
    bestMatch: "Mejor opción",
    alsoConsider: "También puedes considerar",
    bookNow: "Reservar ahora",
    viewDetails: "Ver detalles",
    back: "Atrás",
    restart: "Empezar de nuevo",
    people: "personas",
  },
  en: {
    title: "Find your ideal boat",
    subtitle: "Answer 3 questions and we'll recommend the perfect boat",
    q1: "How many people?",
    q1options: ["2 people", "3-4 people", "5 people", "6+ people"],
    q2: "How long do you want to sail?",
    q2options: ["1-2 hours", "3-4 hours (half day)", "6-8 hours (full day)"],
    q3: "What's your budget?",
    q3options: ["Budget (from 70€)", "Mid-range (100-200€)", "No limit"],
    result: "Your ideal boat is...",
    bestMatch: "Best match",
    alsoConsider: "Also consider",
    bookNow: "Book now",
    viewDetails: "View details",
    back: "Back",
    restart: "Start over",
    people: "people",
  },
};

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

function getReasonText(boat: typeof BOAT_PROFILES[0], lang: string): string {
  const reasons: Record<string, Record<string, string>> = {
    es: {
      "astec-400": "Perfecto para parejas. El mejor precio por persona de toda la flota.",
      "solar-450": "Gran solarium para tomar el sol. Ideal para disfrutar de las calas.",
      "remus-450": "Estable y fácil de manejar. Excelente para familias.",
      "astec-480": "La opción premium sin licencia. Bluetooth y más espacio.",
      "voraz-v2": "Versátil y cómoda. Buen equilibrio entre precio y prestaciones.",
      "mingolla-brava-19": "Espaciosa para grupos. Ducha y mesa para comer a bordo.",
      "trimarchi-57s": "Potente y rápida. Llega a Tossa de Mar en 30 minutos.",
      "pacific-craft-625": "La más grande, lujosa y completa. Para disfrutar sin igual.",
    },
    en: {
      "astec-400": "Perfect for couples. Best price per person in the fleet.",
      "solar-450": "Great sundeck for sunbathing. Ideal for enjoying the coves.",
      "remus-450": "Stable and easy to handle. Excellent for families.",
      "astec-480": "Premium no-license option. Bluetooth and more space.",
      "voraz-v2": "Versatile and comfortable. Good balance of price and features.",
      "mingolla-brava-19": "Spacious for groups. Shower and dining table on board.",
      "trimarchi-57s": "Powerful and fast. Reaches Tossa de Mar in 30 minutes.",
      "pacific-craft-625": "The largest, most luxurious and complete. An unmatched experience.",
    },
  };
  return reasons[lang]?.[boat.id] || reasons.es[boat.id] || "";
}

export default function BoatQuiz({ source = "page", onBoatSelect }: { source?: string; onBoatSelect?: (boatId: string) => void }) {
  const { language } = useLanguage();
  const t = QUIZ_TRANSLATIONS[language] || QUIZ_TRANSLATIONS.es;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({ passengers: null, duration: null, budget: null });

  const handleAnswer = (value: string | number) => {
    if (step === 0) {
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
        reason: getReasonText(boat, language),
        score: scoreBoat(boat, answers),
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [answers, language]);

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
          <Anchor className="w-8 h-8 text-cta mx-auto mb-3" />
          <h3 className="font-heading text-xl font-bold">{t.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-cta' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="text-center mb-5">
          <Icon className="w-6 h-6 text-cta mx-auto mb-2" />
          <p className="font-medium text-lg">{current.question}</p>
        </div>

        <div className="grid gap-3">
          {current.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="w-full text-left px-5 py-3.5 rounded-xl border border-border hover:border-cta hover:bg-cta/5 transition-all text-sm font-medium flex items-center justify-between group"
            >
              {option}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cta transition-colors" />
            </button>
          ))}
        </div>

        {step > 0 && (
          <button
            onClick={() => setStep(prev => prev - 1)}
            className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
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
        <Anchor className="w-8 h-8 text-cta mx-auto mb-3" />
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
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${idx === 0 ? 'bg-cta text-white hover:bg-cta/90' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'}`}
                >
                  {idx === 0 ? t.bookNow : t.viewDetails}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href={`/barco/${rec.id}?utm_source=blog&utm_medium=boat_quiz&utm_campaign=${source}`}
                  onClick={() => trackBlogCtaClick(rec.id, 'boat_quiz_book')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${idx === 0 ? 'bg-cta text-white hover:bg-cta/90' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'}`}
                >
                  {idx === 0 ? t.bookNow : t.viewDetails}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={reset}
        className="mt-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        {t.restart}
      </button>
    </div>
  );
}
