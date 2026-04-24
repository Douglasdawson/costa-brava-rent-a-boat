import { SEO } from "@/components/SEO";
import { useTranslations } from "@/lib/translations";
import { LegalPageLayout } from "@/components/LegalPageLayout";

export default function AccessibilityDeclarationPage() {
  const t = useTranslations();
  const page = t.legalPages?.accessibility;

  return (
    <>
      <SEO
        title="Declaración de Accesibilidad | Costa Brava Rent a Boat"
        description="Declaración de accesibilidad de costabravarentaboat.com conforme al Real Decreto 1112/2018."
        canonical="https://www.costabravarentaboat.com/accesibilidad"
      />
      <LegalPageLayout
        heroTitle={page?.heroTitle ?? "Declaración de Accesibilidad"}
        lastUpdated={page?.lastUpdated ?? "Conforme al Real Decreto 1112/2018, de 7 de septiembre"}
        sections={page?.sections ?? []}
      />
    </>
  );
}
