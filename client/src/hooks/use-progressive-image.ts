import { useState, useEffect } from "react";

/**
 * Tracks whether an image URL has finished loading.
 * Returns `true` once the browser has fully decoded the image,
 * allowing a CSS transition from placeholder to loaded state.
 */
export function useProgressiveImage(src: string): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src]);

  return loaded;
}
