import { useState, useCallback } from "react";
import { useThrottledScroll } from "@/hooks/useThrottledScroll";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback((scrollY: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    setProgress(Math.min(scrollY / scrollHeight, 1));
  }, []);

  useThrottledScroll(handleScroll, 50);

  if (progress <= 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[3px] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-primary/70 origin-left will-change-transform"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
