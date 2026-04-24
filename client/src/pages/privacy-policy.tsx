import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { useTranslations } from "@/lib/translations";
import { LegalPageLayout } from "@/components/LegalPageLayout";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('privacyPolicy', language);
  const hreflangLinks = generateHreflangLinks('privacyPolicy');
  const canonical = generateCanonicalUrl('privacyPolicy', language);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.privacyPolicy, url: "/privacy-policy" }
  ]);

  const page = t.legalPages?.privacy;

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
        heroTitle={page?.heroTitle ?? "Política de Privacidad"}
        lastUpdated={page?.lastUpdated ?? "Última actualización: febrero de 2026"}
        sections={page?.sections ?? []}
      />
    </>
  );
}
