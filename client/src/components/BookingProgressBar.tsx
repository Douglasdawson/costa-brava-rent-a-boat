import { Check } from "lucide-react";

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

/**
 * Numbered dots + a single caption for the current step.
 *
 * Six labels never fit: each cell is ~98px on desktop and ~44px on a phone,
 * while "Hora y duración" alone measures ~88px — so they collided (and German
 * or Russian would be worse). Printing only the active label removes the
 * constraint instead of fighting it: one label owns the full width, the copy
 * gets a readable size, and nothing breaks when a step or a language is added.
 * Nothing is lost for assistive tech either — every dot still carries its full
 * name in aria-label, so the caption is aria-hidden to avoid a double reading.
 */
export default function BookingProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: BookingProgressBarProps) {
  const activeLabel = stepLabels[currentStep - 1] || "";

  return (
    <nav aria-label="Booking progress" className="w-full">
      <div className="flex items-center w-full">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNum = index + 1;
          const isComplete = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              <div
                role="img"
                className={`
                  w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold
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

              {/* Connecting line (not after the last step). */}
              {index < totalSteps - 1 && (
                <div className="flex-1 min-w-[10px] h-0.5 mx-1.5 relative overflow-hidden rounded-full bg-border">
                  <div
                    className="absolute left-0 top-0 h-full bg-foreground rounded-full transition-all duration-500 ease-out"
                    style={{ width: isComplete ? "100%" : isActive ? "50%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Caption. `key` restarts the fade on every step change, so the label
          reads as "this changed" instead of silently swapping. */}
      <p
        key={currentStep}
        className="mt-2 text-center text-[13px] leading-none animate-fade-in"
        aria-hidden="true"
      >
        <span className="tabular-nums text-muted-foreground">
          {currentStep}/{totalSteps}
        </span>
        {activeLabel && (
          <>
            <span className="mx-1.5 text-border" aria-hidden="true">
              ·
            </span>
            <span className="font-semibold text-foreground">{activeLabel}</span>
          </>
        )}
      </p>
    </nav>
  );
}
