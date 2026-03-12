import type { Translations } from "@/lib/translations";

interface BookingProgressIndicatorProps {
  currentStep: number;
  t: Translations;
}

export function BookingProgressIndicator({ currentStep, t }: BookingProgressIndicatorProps) {
  const stepTitles = [
    t.booking?.date || 'Date',
    t.booking?.selectBoat || 'Boat',
    t.booking?.time || 'Time',
    t.booking?.extras || 'Extras',
    t.booking?.customerDetails || 'Details',
    t.booking?.payment || 'Payment',
  ];

  return (
    <>
      {/* Mobile: Current step only */}
      <div className="flex sm:hidden items-center justify-center mb-6 gap-2">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
          {currentStep}
        </div>
        <span className="text-sm font-medium text-foreground">{stepTitles[currentStep - 1]}</span>
        <span className="text-xs text-muted-foreground">/ {stepTitles.length}</span>
      </div>

      {/* Desktop: Full progress bar */}
      <div className="hidden sm:flex items-center justify-center mb-8">
        {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                stepNumber <= currentStep
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-muted-foreground'
              }`}
            >
              {stepNumber}
            </div>
            {stepNumber < 6 && (
              <div
                className={`w-12 h-1 ${
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
