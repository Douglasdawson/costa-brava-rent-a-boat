import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * Thin progress bar that animates at the top of the viewport during route transitions.
 * Listens to wouter location changes, quickly fills to ~90%, then completes on next paint.
 */
export function RouteProgressBar() {
  const [location] = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const prevLocation = useRef(location);

  useEffect(() => {
    // Skip the initial mount
    if (prevLocation.current === location) return;
    prevLocation.current = location;

    // Clear any pending timers from a previous navigation
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Start: show bar and animate to 90%
    setVisible(true);
    setProgress(0);

    // Use rAF to ensure the 0% state renders before transitioning to 90%
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setProgress(90);
      });
    });

    // After a short delay, complete to 100% and fade out
    timeoutRef.current = setTimeout(() => {
      setProgress(100);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 400);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms ease-out" }}
    >
      <div
        className="h-full bg-[#A8C4DD]"
        style={{
          width: `${progress}%`,
          transition: progress === 0
            ? "none"
            : progress <= 90
              ? "width 350ms cubic-bezier(0.4, 0, 0.2, 1)"
              : "width 200ms ease-out",
        }}
      />
    </div>
  );
}
