import { Check } from "lucide-react";

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export default function BookingProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: BookingProgressBarProps) {
  return (
    <nav aria-label="Booking progress" className="w-full">
      {/* pb-5 reserves vertical room for the labels (absolute positioned so
          their width never starves the connector lines of flex space). */}
      <div className="flex items-center w-full pb-5">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNum = index + 1;
          const isComplete = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + absolute label */}
              <div className="relative flex items-center justify-center">
                <div
                  role="img"
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold
                    transition-all duration-300
                    ${isComplete
                      ? "bg-foreground text-white"
                      : isActive
                      ? "bg-foreground text-white step-pulse"
                      : "bg-transparent border-2 border-border text-muted-foreground"
                    }
                  `}
                  aria-label={`Step ${stepNum}: ${stepLabels[index] || ""}${isComplete ? " (completed)" : isActive ? " (current)" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>
                {/* Label below the circle — absolute so its width never
                    competes with the connecting line for flex space. */}
                <span
                  className={`
                    hidden xs:block absolute top-full left-1/2 -translate-x-1/2 mt-1
                    text-[10px] sm:text-[11px] font-medium whitespace-nowrap
                    transition-colors duration-300
                    ${isActive
                      ? "text-foreground font-semibold"
                      : isComplete
                      ? "text-foreground"
                      : "text-muted-foreground"
                    }
                  `}
                  aria-hidden="true"
                >
                  {stepLabels[index] || ""}
                </span>
              </div>

              {/* Connecting line (not after last step). min-w guarantees a
                  visible segment even when surrounding labels are wide. */}
              {index < totalSteps - 1 && (
                <div className="flex-1 min-w-[10px] h-0.5 mx-1 relative overflow-hidden rounded-full bg-border">
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
    </nav>
  );
}
