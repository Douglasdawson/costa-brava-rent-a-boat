import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";

// First-layer privacy notice for newsletter sign-ups (RGPD art. 13, LOPDGDD art. 11).
export function NewsletterLegalNote({ className }: { className?: string }) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const [before, after = ""] = t.footer.newsletterLegal.split("{privacyPolicy}");
  return (
    <p className={className}>
      {before}
      <a href={localizedPath("privacyPolicy")} className="underline">
        {t.footer.privacy}
      </a>
      {after}
    </p>
  );
}
