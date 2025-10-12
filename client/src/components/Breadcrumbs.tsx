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
          
          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              {isLast ? (
                <span className="text-gray-600 font-medium" aria-current="page" data-testid={`breadcrumb-current`}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href!} className="text-primary hover:underline" data-testid={`breadcrumb-link-${index}`}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
