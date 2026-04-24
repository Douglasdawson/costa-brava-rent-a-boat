import { useEffect } from "react";
import { useTranslations } from "@/lib/translations";
import { SEO } from "@/components/SEO";
import { getSEOConfig, generateCanonicalUrl, generateHreflangLinks, generateBreadcrumbSchema } from "@/utils/seo-config";
import { useLanguage } from "@/hooks/use-language";
import { LegalPageLayout } from "@/components/LegalPageLayout";

export default function CookiesPolicy() {
  const t = useTranslations();
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('cookiesPolicy', language);
  const canonical = generateCanonicalUrl('cookiesPolicy', language);
  const hreflangLinks = generateHreflangLinks('cookiesPolicy');
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.legal, url: "/" },
    { name: t.breadcrumbs.cookiesPolicy, url: "/cookies" }
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const page = t.legalPages?.cookies;

  return (
    <>
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={breadcrumbSchema}
      />
      <LegalPageLayout
        heroTitle={page?.heroTitle ?? "Política de Cookies"}
        lastUpdated={page?.lastUpdated ?? "Última actualización: febrero de 2026"}
        sections={page?.sections ?? []}
      />
    </>
  );
}
