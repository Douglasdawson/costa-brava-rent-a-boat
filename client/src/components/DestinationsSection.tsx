import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Compass,
  Waves,
  Heart,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";

export default function DestinationsSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();

  return (
    <section className="py-12 bg-background" id="destinations">
      <div className="container mx-auto px-4">

        {/* Destinations */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t.destinations.fromBlanes}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              {t.destinations.fromBlanesSub}
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            <Link href={localizedPath("locationTossa")} asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Compass className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-center">{t.destinations.tossaName}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <Badge variant="outline" className="mb-3">
                      <Clock className="w-4 h-4 mr-2" />
                      {t.destinations.tossaDuration}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {t.destinations.tossaDesc}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">{t.destinations.tossaH1}</span>
                    <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">{t.destinations.tossaH2}</span>
                    <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">{t.destinations.tossaH3}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group-hover:bg-primary group-hover:text-white transition-colors"
                    aria-label={`Ver detalles de ${t.destinations.tossaName}`}
                  >
                    {t.destinations.viewDetails}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t.destinations.boatTypes}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              {t.destinations.boatTypesSub}
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            <Link href={localizedPath("categoryLicenseFree")} asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-center">{t.destinations.licenseFree}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {t.destinations.licenseFreeDesc}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">{t.destinations.licenseFreeFeat1}</span>
                    <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">{t.destinations.licenseFreeFeat2}</span>
                    <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">{t.destinations.licenseFreeFeat3}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group-hover:bg-primary group-hover:text-white transition-colors"
                    aria-label={`Ver barcos de ${t.destinations.licenseFree}`}
                  >
                    {t.destinations.viewBoats}
                    <Waves className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
