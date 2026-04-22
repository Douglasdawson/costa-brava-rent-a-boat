import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Anchor, HelpCircle, Phone } from "lucide-react";
import { Link } from "wouter";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { trackPhoneClick } from "@/utils/analytics";

export default function NotFound() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold mb-2">
            {t.notFound?.title || 'Page not found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t.notFound?.description || 'The page you are looking for does not exist or has been moved.'}
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={localizedPath("home")}>{t.notFound?.backHome || 'Back to home'}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={localizedPath("home") + "#fleet"}>
                <Anchor className="w-4 h-4 mr-2" />
                {t.nav.fleet}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href={localizedPath("faq")}>
                <HelpCircle className="w-4 h-4 mr-2" />
                {t.nav.faq}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <a href="tel:+34611500372" onClick={() => trackPhoneClick()}>
                <Phone className="w-4 h-4 mr-2" />
                +34 611 500 372
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
