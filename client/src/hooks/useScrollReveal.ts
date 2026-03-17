import { useEffect, useRef, useState } from "react";

export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Fallback: if IntersectionObserver is not supported, show immediately
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin: "0px 0px 100px 0px" }
    );

    observer.observe(node);

    // The IntersectionObserver callback fires asynchronously (no forced reflow).
    // No need for a synchronous getBoundingClientRect safety net —
    // the rootMargin: 100px already handles near-viewport elements.

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
