import BookingFormWidget from "@/components/BookingFormWidget";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";

export default function MobileBooking() {
  const { language } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const seoConfig = getSEOConfig('booking', language);
  const hreflangLinks = generateHreflangLinks('booking');
  const canonical = generateCanonicalUrl('booking', language);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
      />
      <Navigation />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <BookingFormWidget />
        </div>
      </main>
      <Footer />
    </div>
  );
}
