import { Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useTranslations } from "@/lib/translations";

export default function GiftCardBanner() {
  const [, setLocation] = useLocation();
  const t = useTranslations();
  const banner = t.giftCardBanner;

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-xl">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white rounded-full -translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
            {/* Left: Icon + Text */}
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                  {banner.title}
                </h2>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg max-w-lg">
                  {banner.subtitle}
                </p>
              </div>
            </div>

            {/* Right: CTA Button */}
            <div className="flex-shrink-0">
              <Button
                size="lg"
                onClick={() => setLocation("/tarjetas-regalo")}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-base px-6 py-3 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                {banner.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
