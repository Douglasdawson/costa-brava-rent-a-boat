import type { Translations } from "@/lib/translations";

interface BookingProgressIndicatorProps {
  currentStep: number;
  t: Translations;
}

export function BookingProgressIndicator({ currentStep, t }: BookingProgressIndicatorProps) {
  const totalSteps = 3;
  const stepTitles = [
    t.booking?.stepExperience || 'Experience',
    t.booking?.stepPersonalize || 'Personalize',
    t.booking?.stepPay || 'Payment',
  ];

  return (
    <>
      {/* Mobile: Current step only */}
      <div className="flex sm:hidden items-center justify-center mb-6 gap-2">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
          {currentStep}
        </div>
        <span className="text-sm font-medium text-foreground">{stepTitles[currentStep - 1]}</span>
        <span className="text-xs text-muted-foreground">/ {totalSteps}</span>
      </div>

      {/* Desktop: Full progress bar */}
      <div className="hidden sm:flex items-center justify-center mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                  stepNumber <= currentStep
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-muted-foreground'
                }`}
              >
                {stepNumber}
              </div>
              <span className={`text-xs mt-1 ${
                stepNumber <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {stepTitles[stepNumber - 1]}
              </span>
            </div>
            {stepNumber < totalSteps && (
              <div
                className={`w-16 h-1 mx-2 mb-5 ${
                  stepNumber < currentStep ? 'bg-primary' : 'bg-primary/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
