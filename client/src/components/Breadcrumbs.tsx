import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "@/lib/translations";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const t = useTranslations();
  
  // Helper function to get translated text from a key
  const getTranslatedLabel = (label: string): string => {
    // If label starts with 'breadcrumbs.', it's a translation key
    if (label.startsWith('breadcrumbs.')) {
      const key = label.split('.')[1] as keyof typeof t.breadcrumbs;
      return t.breadcrumbs?.[key] || label;
    }
    // Otherwise return as-is (for direct text)
    return label;
  };
  
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      <ol className="flex items-center space-x-2">
        <li className="flex items-center">
          <Link href="/" className="text-primary hover:underline flex items-center" data-testid="breadcrumb-home">
            <Home className="w-4 h-4 mr-1" />
            {t.breadcrumbs?.home || "Inicio"}
          </Link>
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const translatedLabel = getTranslatedLabel(item.label);
          
          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              {isLast ? (
                <span className="text-gray-600 font-medium" aria-current="page" data-testid={`breadcrumb-current`}>
                  {translatedLabel}
                </span>
              ) : (
                <Link href={item.href!} className="text-primary hover:underline" data-testid={`breadcrumb-link-${index}`}>
                  {translatedLabel}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
