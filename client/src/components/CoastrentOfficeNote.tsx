import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  CARABELA,
  carabelaOpen,
  coastrentUrl,
  type CoastrentSurface,
} from "@shared/coastrentLinks";

interface CoastrentOfficeNoteProps {
  /** Where the link is being rendered from. Becomes utm_campaign. */
  surface: CoastrentSurface;
  className?: string;
}

/**
 * Una frase: desde el 1-feb-2027 la tienda de Coast Rent del Centro Comercial Carabela es la
 * oficina de reservas de CBRB en Lloret. Los barcos siguen saliendo de Blanes y la frase lo
 * dice siempre, para que nadie se plante en Lloret buscando el barco. El mismo texto va en la
 * landing de Lloret, en Sobre nosotros y en el pie; el servidor lo replica en el bodyFallback
 * (seoInjector) para los crawlers sin JS. El gating por fecha vive en carabelaOpen().
 */
export default function CoastrentOfficeNote({ surface, className }: CoastrentOfficeNoteProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.coastrentOffice;

  return (
    <p className={className}>
      <strong>{s.title}:</strong>{" "}
      <a
        href={coastrentUrl("home", language, surface)}
        target="_blank"
        rel="noopener"
        className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
      >
        {CARABELA.shortLabel}
      </a>{" "}
      ({carabelaOpen() ? s.open : s.opensOn}). {s.departures}
    </p>
  );
}
