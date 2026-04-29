import type { Translations } from "@/lib/translations";

interface BookingProgressIndicatorProps {
  currentStep: number;
  t: Translations;
}

export function BookingProgressIndicator({ currentStep, t }: BookingProgressIndicatorProps) {
  const totalSteps = 3;
  const stepTitles = [
    t.booking?.stepExperience || 'Tu plan',
    t.booking?.stepPersonalize || 'Tus datos',
    t.booking?.stepPay || 'Confirmar',
  ];

  const counterTemplate = t.booking?.stepCounter || 'Paso {current} de {total}';
  const counter = counterTemplate
    .replace('{current}', String(currentStep))
    .replace('{total}', String(totalSteps));

  return (
    <div className="flex flex-col gap-3">
      {/* Counter + active step name */}
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg sm:text-xl font-semibold text-foreground tracking-tight">
          {stepTitles[currentStep - 1]}
        </h2>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground tabular-nums shrink-0">
          {counter}
        </span>
      </div>

      {/* Segmented progress bar */}
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={counter}>
        {[1, 2, 3].map((stepNumber) => (
          <span
            key={stepNumber}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              stepNumber <= currentStep
                ? 'bg-foreground'
                : 'bg-foreground/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
