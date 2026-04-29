import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function EditorialMomentSection() {
  const t = useTranslations();
  const { ref: revealRef, isVisible } = useScrollReveal();

  const copy = t.editorialMoment?.copy ?? "El sol no se pone aquí. Se queda contigo.";
  const altText = t.editorialMoment?.alt ?? "Atardecer dorado sobre el castillo medieval de Tossa de Mar y su cala turquesa, con un barco en la distancia";

  return (
    <section
      ref={revealRef}
      className={`relative w-full overflow-hidden transition-[opacity,filter] duration-700 ${isVisible ? "opacity-100 blur-none" : "opacity-0 blur-[2px]"}`}
      aria-label={altText}
    >
      <picture>
        <source
          media="(min-width: 768px)"
          type="image/avif"
          srcSet="/images/locations/hero-tossa-de-mar.avif"
        />
        <source
          media="(max-width: 767px)"
          type="image/avif"
          srcSet="/images/locations/hero-tossa-de-mar-mobile.avif"
        />
        <source
          media="(min-width: 768px)"
          type="image/webp"
          srcSet="/images/locations/hero-tossa-de-mar.webp"
        />
        <source
          media="(max-width: 767px)"
          type="image/webp"
          srcSet="/images/locations/hero-tossa-de-mar-mobile.webp"
        />
        <img
          src="/images/locations/hero-tossa-de-mar-mobile.jpg"
          alt={altText}
          className="block w-full h-[60vh] min-h-[420px] md:h-[80vh] md:min-h-[560px] object-cover"
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
        />
      </picture>

      <div
        className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/25 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <p
        className="absolute bottom-0 left-0 right-0 max-w-2xl px-6 pb-10 md:px-16 md:pb-20 font-heading font-light italic text-primary-foreground tracking-tight leading-[1.15] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
        style={{ fontSize: "clamp(1.625rem, 4.5vw, 3rem)" }}
      >
        {copy}
      </p>
    </section>
  );
}
