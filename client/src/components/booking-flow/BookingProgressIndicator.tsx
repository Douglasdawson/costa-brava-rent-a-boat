interface BookingProgressIndicatorProps {
  currentStep: number;
}

export function BookingProgressIndicator({ currentStep }: BookingProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto">
      {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 ${
              stepNumber <= currentStep
                ? 'bg-primary text-white'
                : 'bg-primary/10 text-muted-foreground'
            }`}
          >
            {stepNumber}
          </div>
          {stepNumber < 6 && (
            <div
              className={`w-8 sm:w-12 h-1 ${
                stepNumber < currentStep ? 'bg-primary' : 'bg-primary/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
