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

    // Safety net: if the element is already near the viewport, reveal it
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      setIsVisible(true);
      observer.unobserve(node);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
