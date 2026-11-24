import type React from "react";

/**
 * Responsive hero photo: AVIF/WebP/JPG with desktop and mobile variants
 * (`<basePath>.avif|webp|jpg` and `<basePath>-mobile.avif|webp|jpg`). Eager and
 * high priority: it is the LCP element of every page that uses it. The parent
 * must be `relative` with a fixed height; the image fills it.
 */
export function HeroImage({ basePath, alt }: { basePath: string; alt: string }) {
  return (
    <picture>
      <source media="(min-width: 768px)" type="image/avif" srcSet={`${basePath}.avif`} />
      <source type="image/avif" srcSet={`${basePath}-mobile.avif`} />
      <source media="(min-width: 768px)" type="image/webp" srcSet={`${basePath}.webp`} />
      <source type="image/webp" srcSet={`${basePath}-mobile.webp`} />
      <img
        src={`${basePath}.jpg`}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
        loading="eager"
        {...({ fetchpriority: "high" } as unknown as React.ImgHTMLAttributes<HTMLImageElement>)}
      />
    </picture>
  );
}
