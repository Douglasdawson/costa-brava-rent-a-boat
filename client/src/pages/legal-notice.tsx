import { useEffect } from "react";
import { useTranslations } from "@/lib/translations";
import { SEO } from "@/components/SEO";
import { getSEOConfig, generateCanonicalUrl, generateHreflangLinks, generateBreadcrumbSchema } from "@/utils/seo-config";
import { useLanguage } from "@/hooks/use-language";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  BUSINESS_REGISTERED_ADDRESS_FORMATTED,
  BUSINESS_EMAIL,
  BUSINESS_LEGAL_NAME,
  BUSINESS_PHONE,
  BUSINESS_TAX_ID,
} from "@shared/businessProfile";

export default function LegalNotice() {
  const t = useTranslations();
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('legalNotice', language);
  const canonical = generateCanonicalUrl('legalNotice', language);
  const hreflangLinks = generateHreflangLinks('legalNotice');
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.legal, url: "/" },
    { name: t.legalPages?.legalNotice?.heroTitle ?? "Aviso Legal", url: "/aviso-legal" }
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const page = t.legalPages?.legalNotice;

  // La identificación se compone aquí y no en los ficheros de idioma: la razón
  // social, el CIF y el domicilio son los mismos en los 8 locales, y traducirlos
  // es lo que dejó "Puerto de Blanes" (un landmark, no la calle) como domicilio
  // en privacidad y términos durante meses.
  const identification = page
    ? {
        title: page.identificationTitle,
        body: [
          `${page.labels.legalName}: ${BUSINESS_LEGAL_NAME}`,
          `${page.labels.taxId}: ${BUSINESS_TAX_ID}`,
          `${page.labels.address}: ${BUSINESS_REGISTERED_ADDRESS_FORMATTED}, España`,
          `${page.labels.phone}: ${BUSINESS_PHONE}`,
          `${page.labels.email}: ${BUSINESS_EMAIL}`,
          `${page.labels.activity}: ${page.activityValue}`,
        ].join("\n"),
      }
    : null;

  const sections = identification ? [identification, ...page!.sections] : [];

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
        heroTitle={page?.heroTitle ?? "Aviso Legal"}
        lastUpdated={page?.lastUpdated ?? ""}
        sections={sections}
      />
    </>
  );
}
