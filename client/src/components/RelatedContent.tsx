import { useLanguage } from "@/hooks/use-language";
import { ArrowRight } from "lucide-react";

type ContentType = "blog" | "actividad" | "ubicacion" | "guia";

interface RelatedItemDef {
  title: string;
  description: string;
  pageKey: string;
  param?: string;
  type: ContentType;
}

interface RelatedContentProps {
  currentPage: string;
}

const TYPE_STYLES: Record<ContentType, { label: string; labelEn: string; className: string }> = {
  blog: { label: "Blog", labelEn: "Blog", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  actividad: { label: "Actividad", labelEn: "Activity", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  ubicacion: { label: "Ubicacion", labelEn: "Location", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  guia: { label: "Guia", labelEn: "Guide", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
};

const RELATED_CONTENT: Record<string, RelatedItemDef[]> = {
  locationBlanes: [
    { title: "Las 10 mejores calas de Blanes en barco", description: "Descubre las calas mas bonitas accesibles solo desde el mar", pageKey: "blogDetail", param: "mejores-calas-blanes-accesibles-en-barco", type: "blog" },
    { title: "Excursion de snorkel en barco", description: "Las mejores calas para snorkel cerca de Blanes", pageKey: "activitySnorkel", type: "actividad" },
    { title: "Barcos para familias", description: "La experiencia perfecta para toda la familia", pageKey: "activityFamilies", type: "actividad" },
    { title: "Rutas en barco desde Blanes", description: "5 rutas con mapas interactivos", pageKey: "routes", type: "guia" },
  ],
  locationLloret: [
    { title: "Mejores calas Costa Brava en barco", description: "Las 10 calas mas espectaculares entre Blanes y Tossa", pageKey: "blogDetail", param: "mejores-calas-costa-brava-en-barco", type: "blog" },
    { title: "Sunset boat trip", description: "Experiencia de atardecer en barco", pageKey: "activitySunset", type: "actividad" },
    { title: "Barcos sin licencia", description: "5 barcos desde 70EUR/h, gasolina incluida", pageKey: "categoryLicenseFree", type: "guia" },
  ],
  locationTossa: [
    { title: "Mejores calas Costa Brava en barco", description: "Las 10 calas mas espectaculares entre Blanes y Tossa", pageKey: "blogDetail", param: "mejores-calas-costa-brava-en-barco", type: "blog" },
    { title: "Barcos con licencia", description: "Llega a Tossa en 30 min con nuestros barcos potentes", pageKey: "categoryLicensed", type: "guia" },
    { title: "Pesca desde barco", description: "Pesca deportiva en las aguas de la Costa Brava", pageKey: "activityFishing", type: "actividad" },
  ],
  activitySnorkel: [
    { title: "Mejores calas de Blanes en barco", description: "Calas con aguas cristalinas perfectas para snorkel", pageKey: "blogDetail", param: "mejores-calas-blanes-accesibles-en-barco", type: "blog" },
    { title: "Barcos sin licencia", description: "Perfectos para excursiones de snorkel", pageKey: "categoryLicenseFree", type: "guia" },
    { title: "Alquiler barcos Blanes", description: "Todo sobre alquilar barco en Puerto de Blanes", pageKey: "locationBlanes", type: "ubicacion" },
  ],
  activityFamilies: [
    { title: "Que llevar en un barco", description: "Checklist completo para tu dia en el mar", pageKey: "blogDetail", param: "que-llevar-barco-alquiler-checklist", type: "blog" },
    { title: "Excursion de snorkel", description: "Actividad perfecta para ninos", pageKey: "activitySnorkel", type: "actividad" },
    { title: "Precios alquiler barcos", description: "Consulta tarifas por temporada", pageKey: "pricing", type: "guia" },
  ],
  activitySunset: [
    { title: "Boat routes from Blanes", description: "5 routes with interactive maps", pageKey: "routes", type: "guia" },
    { title: "Best coves Costa Brava", description: "Top 10 coves between Blanes and Tossa", pageKey: "blogDetail", param: "mejores-calas-costa-brava-en-barco", type: "blog" },
    { title: "No license boats", description: "Perfect for sunset trips, from 70EUR/h", pageKey: "categoryLicenseFree", type: "guia" },
  ],
  activityFishing: [
    { title: "Barcos con licencia", description: "Barcos potentes para zonas de pesca", pageKey: "categoryLicensed", type: "guia" },
    { title: "Rutas en barco desde Blanes", description: "Descubre las mejores zonas", pageKey: "routes", type: "guia" },
    { title: "Alquiler barcos Costa Brava", description: "8 barcos disponibles en Blanes", pageKey: "locationCostaBrava", type: "ubicacion" },
  ],
  categoryLicenseFree: [
    { title: "Barco sin licencia vs con licencia", description: "Guia comparativa completa", pageKey: "blogDetail", param: "barco-sin-licencia-vs-con-licencia-guia", type: "blog" },
    { title: "Barcos para familias", description: "Experiencia perfecta sin necesidad de licencia", pageKey: "activityFamilies", type: "actividad" },
    { title: "Que llevar en el barco", description: "Checklist para tu dia en el mar", pageKey: "blogDetail", param: "que-llevar-barco-alquiler-checklist", type: "blog" },
  ],
  categoryLicensed: [
    { title: "Barco sin licencia vs con licencia", description: "Guia comparativa completa", pageKey: "blogDetail", param: "barco-sin-licencia-vs-con-licencia-guia", type: "blog" },
    { title: "Pesca desde barco", description: "Barcos con licencia para zonas de pesca", pageKey: "activityFishing", type: "actividad" },
    { title: "Excursion a Tossa de Mar", description: "Llega en 30 min con barco con licencia", pageKey: "locationTossa", type: "ubicacion" },
  ],
};

export default function RelatedContent({ currentPage }: RelatedContentProps) {
  const { language, localizedPath } = useLanguage();
  const itemDefs = RELATED_CONTENT[currentPage];

  if (!itemDefs || itemDefs.length === 0) {
    return null;
  }

  const isEnglish = language === "en";
  const sectionTitle = isEnglish ? "You might also like" : "Tambien te puede interesar";
  const linkText = isEnglish ? "Learn more" : "Ver mas";

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground text-center mb-8">
          {sectionTitle}
        </h2>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${itemDefs.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-6 max-w-5xl mx-auto`}>
          {itemDefs.map((item, index) => {
            const typeStyle = TYPE_STYLES[item.type];
            const typeLabel = isEnglish ? typeStyle.labelEn : typeStyle.label;
            const href = localizedPath(item.pageKey, item.param);

            return (
              <a
                key={index}
                href={href}
                className="group bg-background border rounded-lg p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className={`inline-block w-fit text-xs font-medium px-2.5 py-0.5 rounded-full ${typeStyle.className}`}>
                  {typeLabel}
                </span>
                <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-auto">
                  {linkText}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
