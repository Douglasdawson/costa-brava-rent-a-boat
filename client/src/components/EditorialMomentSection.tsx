import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function EditorialMomentSection() {
  const t = useTranslations();
  const { ref: revealRef, isVisible } = useScrollReveal();

  const copy = t.editorialMoment?.copy ?? "Calas que solo existen si llegas en barco.";
  const altText = t.editorialMoment?.alt ?? "Vista aérea de una cala escondida de la Costa Brava con aguas turquesas, un barco fondeado junto a un acantilado de pinos y dos bañistas en el agua";

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
          srcSet="/images/locations/editorial-cala-secreta.avif"
        />
        <source
          media="(max-width: 767px)"
          type="image/avif"
          srcSet="/images/locations/editorial-cala-secreta-mobile.avif"
        />
        <source
          media="(min-width: 768px)"
          type="image/webp"
          srcSet="/images/locations/editorial-cala-secreta.webp"
        />
        <source
          media="(max-width: 767px)"
          type="image/webp"
          srcSet="/images/locations/editorial-cala-secreta-mobile.webp"
        />
        <img
          src="/images/locations/editorial-cala-secreta-mobile.jpg"
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
