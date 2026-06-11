import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Globe, Check } from 'lucide-react';
import { useLanguage, Language } from '@/hooks/use-language';
import CountryFlag from '@/components/booking/CountryFlag';

// iso2 drives the SVG flag (country-flag-icons). Catalonia has no ISO 3166-1
// code (and its emoji renders as a broken black flag on most platforms), so
// Català renders a text code chip instead of a flag.
const languages = [
  { code: 'es' as Language, name: 'Español', iso2: 'ES', flag: '🇪🇸' },
  { code: 'ca' as Language, name: 'Català', iso2: '', flag: '' },
  { code: 'en' as Language, name: 'English', iso2: 'GB', flag: '🇬🇧' },
  { code: 'fr' as Language, name: 'Français', iso2: 'FR', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'Deutsch', iso2: 'DE', flag: '🇩🇪' },
  { code: 'nl' as Language, name: 'Nederlands', iso2: 'NL', flag: '🇳🇱' },
  { code: 'it' as Language, name: 'Italiano', iso2: 'IT', flag: '🇮🇹' },
  { code: 'ru' as Language, name: 'Русский', iso2: 'RU', flag: '🇷🇺' },
];

function LanguageFlag({ iso2, flag, langCode }: { iso2: string; flag: string; langCode: string }) {
  if (!iso2) {
    return (
      <span
        aria-hidden
        className="inline-flex w-[1.125rem] h-3 items-center justify-center rounded-[2px] border border-border bg-muted text-[8px] font-semibold leading-none text-muted-foreground align-middle"
      >
        {langCode.toUpperCase()}
      </span>
    );
  }
  return <CountryFlag iso2={iso2} emoji={flag} />;
}

interface LanguageSelectorProps {
  variant?: 'button' | 'minimal';
  className?: string;
}

export default function LanguageSelector({ variant = 'button', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-8 h-8 bg-muted rounded"></div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`w-11 h-11 p-0 hover-elevate ${className}`}
            data-testid="button-language-selector"
          >
            <Globe className="w-4 h-4" />
            <span className="sr-only">Cambiar idioma</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center justify-between cursor-pointer"
              data-testid={`language-option-${lang.code}`}
            >
              <div className="flex items-center gap-2">
                <LanguageFlag iso2={lang.iso2} flag={lang.flag} langCode={lang.code} />
                <span>{lang.name}</span>
              </div>
              {language === lang.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 hover-elevate ${className}`}
          data-testid="button-language-selector"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage?.name}</span>
          <span className="sm:hidden">
            {currentLanguage && (
              <LanguageFlag
                iso2={currentLanguage.iso2}
                flag={currentLanguage.flag}
                langCode={currentLanguage.code}
              />
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>Idioma / Language</span>
          </div>
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`language-option-${lang.code}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
            {language === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <div className="p-2 border-t">
          <Badge variant="secondary" className="text-xs">
            Detección automática
          </Badge>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}