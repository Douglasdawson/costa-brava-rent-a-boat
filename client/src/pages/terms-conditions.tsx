import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { useTranslations } from "@/lib/translations";
import { LegalPageLayout } from "@/components/LegalPageLayout";

export default function TermsConditionsPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('termsConditions', language);
  const hreflangLinks = generateHreflangLinks('termsConditions');
  const canonical = generateCanonicalUrl('termsConditions', language);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.termsConditions, url: "/terms-conditions" }
  ]);

  const page = t.legalPages?.terms;

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
        heroTitle={page?.heroTitle ?? "Términos y Condiciones"}
        lastUpdated={page?.lastUpdated ?? "Última actualización: febrero de 2026"}
        sections={page?.sections ?? []}
      />
    </>
  );
}
