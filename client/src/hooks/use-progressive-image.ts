import { useState, useEffect } from "react";

/**
 * Tracks whether an image URL has finished loading.
 * Returns `true` once the browser has fully decoded the image,
 * allowing a CSS transition from placeholder to loaded state.
 */
export function useProgressiveImage(src: string): boolean {
  const [loaded, setLoaded] = useState(() => {
    if (typeof document === "undefined") return false;
    const img = new Image();
    img.src = src;
    return img.complete && img.naturalWidth > 0;
  });

  useEffect(() => {
    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    img.onload = () => setLoaded(true);
    return () => { img.onload = null; };
  }, [src]);

  return loaded;
}
