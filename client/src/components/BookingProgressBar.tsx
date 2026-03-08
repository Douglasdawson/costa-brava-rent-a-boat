import { Check, Clock } from "lucide-react";

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  estimatedTime?: string;
}

export default function BookingProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
  estimatedTime,
}: BookingProgressBarProps) {
  return (
    <nav aria-label="Booking progress" className="w-full">
      <div className="flex items-center justify-between">
        {/* Step circles and connecting lines */}
        <div className="flex items-center w-full">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNum = index + 1;
            const isComplete = currentStep > stepNum;
            const isActive = currentStep === stepNum;

            return (
              <div key={stepNum} className="flex items-center flex-1 last:flex-none">
                {/* Step circle + label */}
                <div className="flex flex-col items-center gap-1 relative">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${isComplete
                        ? "bg-foreground text-white"
                        : isActive
                        ? "bg-cta text-foreground ring-[3px] ring-cta/30 animate-pulse-subtle"
                        : "bg-transparent border-2 border-border text-muted-foreground"
                      }
                    `}
                    aria-label={`Step ${stepNum}: ${stepLabels[index] || ""}${isComplete ? " (completed)" : isActive ? " (current)" : ""}`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isComplete ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <span>{stepNum}</span>
                    )}
                  </div>
                  {/* Label below circle - hidden on very small screens */}
                  <span
                    className={`
                      hidden xs:block text-xs font-medium whitespace-nowrap
                      transition-colors duration-300
                      ${isActive
                        ? "text-foreground font-semibold"
                        : isComplete
                        ? "text-foreground/70"
                        : "text-muted-foreground"
                      }
                    `}
                    aria-hidden="true"
                  >
                    {stepLabels[index] || ""}
                  </span>
                </div>

                {/* Connecting line (not after last step) */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-5 relative overflow-hidden rounded-full bg-border">
                    <div
                      className="absolute left-0 top-0 h-full bg-foreground rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: isComplete ? "100%" : isActive ? "50%" : "0%",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Estimated time badge */}
        {estimatedTime && (
          <div className="flex items-center gap-1 ml-3 mb-5 flex-shrink-0">
            <Clock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              {estimatedTime}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
