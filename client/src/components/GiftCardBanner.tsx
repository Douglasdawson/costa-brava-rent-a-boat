import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";

export default function GiftCardBanner() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const banner = t.giftCardBanner;

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl bg-foreground px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            {/* Text */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-light text-white tracking-tight">
                {banner.title}
              </h2>
              <p className="text-white/60 font-light mt-2 max-w-lg">
                {banner.subtitle}
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex-shrink-0">
              <a
                href={localizedPath("giftCards")}
                className="inline-flex items-center gap-2 bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-3 font-medium transition-colors"
              >
                {banner.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
