import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, ArrowLeft, Share2, Copy, Check, ChevronLeft, ChevronRight, Mail, List, Anchor } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import BoatQuiz from "@/components/BoatQuiz";
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";
import { trackBlogView, trackBlogScroll, trackBlogCtaClick, trackBlogShare, trackWhatsAppClick } from "@/utils/analytics";
import type { BlogPost } from "@shared/schema";

const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES', en: 'en-GB', ca: 'ca-ES', fr: 'fr-FR',
  de: 'de-DE', nl: 'nl-NL', it: 'it-IT', ru: 'ru-RU',
};

const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Destinos': { es: 'Destinos', en: 'Destinations', ca: 'Destinacions', fr: 'Destinations', de: 'Reiseziele', nl: 'Bestemmingen', it: 'Destinazioni', ru: 'Направления' },
  'Consejos': { es: 'Consejos', en: 'Tips', ca: 'Consells', fr: 'Conseils', de: 'Tipps', nl: 'Tips', it: 'Consigli', ru: 'Советы' },
  'Guías': { es: 'Guías', en: 'Guides', ca: 'Guies', fr: 'Guides', de: 'Anleitungen', nl: 'Gidsen', it: 'Guide', ru: 'Гиды' },
  'Aventuras': { es: 'Aventuras', en: 'Adventures', ca: 'Aventures', fr: 'Aventures', de: 'Abenteuer', nl: 'Avonturen', it: 'Avventure', ru: 'Приключения' },
  'Naturaleza': { es: 'Naturaleza', en: 'Nature', ca: 'Natura', fr: 'Nature', de: 'Natur', nl: 'Natuur', it: 'Natura', ru: 'Природа' },
  'Gastronomía': { es: 'Gastronomía', en: 'Gastronomy', ca: 'Gastronomia', fr: 'Gastronomie', de: 'Gastronomie', nl: 'Gastronomie', it: 'Gastronomia', ru: 'Гастрономия' },
  'Cultura': { es: 'Cultura', en: 'Culture', ca: 'Cultura', fr: 'Culture', de: 'Kultur', nl: 'Cultuur', it: 'Cultura', ru: 'Культура' },
  'Seguridad': { es: 'Seguridad', en: 'Safety', ca: 'Seguretat', fr: 'Sécurité', de: 'Sicherheit', nl: 'Veiligheid', it: 'Sicurezza', ru: 'Безопасность' },
  'Familia': { es: 'Familia', en: 'Family', ca: 'Família', fr: 'Famille', de: 'Familie', nl: 'Familie', it: 'Famiglia', ru: 'Семья' },
};

function localizeCategory(category: string, lang: string): string {
  return CATEGORY_TRANSLATIONS[category]?.[lang] || category;
}

function estimateReadingTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

function localized(byLang: Record<string, string> | null | undefined, fallback: string | null | undefined, lang: string): string {
  if (byLang && byLang[lang]) return byLang[lang];
  return fallback || "";
}

// S5/U1: Extract headings from markdown for TOC
interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function extractHeadings(content: string | null | undefined): TocItem[] {
  if (!content) return [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    const id = text.toLowerCase().replace(/[^\w\sáéíóúñüàèìòùç]/g, '').replace(/\s+/g, '-');
    items.push({ id, text, level });
  }
  return items;
}

// S3: Extract FAQ pairs from markdown (## sections that look like questions)
function extractFAQs(content: string | null | undefined): Array<{ question: string; answer: string }> {
  if (!content) return [];
  const faqs: Array<{ question: string; answer: string }> = [];
  const sections = content.split(/^##\s+/m);
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const heading = lines[0].trim();
    if (heading.includes('?') || heading.toLowerCase().startsWith('cómo') || heading.toLowerCase().startsWith('qué') || heading.toLowerCase().startsWith('cuánto') || heading.toLowerCase().startsWith('cuándo') || heading.toLowerCase().startsWith('how') || heading.toLowerCase().startsWith('what') || heading.toLowerCase().startsWith('when')) {
      const answer = lines.slice(1).join('\n').trim().replace(/^#+\s.+$/gm, '').trim();
      if (answer.length > 20) {
        // Take first paragraph as answer, strip markdown
        const firstPara = answer.split('\n\n')[0].replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
        faqs.push({ question: heading.replace(/\*\*/g, ''), answer: firstPara });
      }
    }
  }
  return faqs;
}

// S5/U1: Table of Contents component
function TableOfContents({ items, title }: { items: TocItem[]; title: string }) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <>
      {/* Mobile: collapsible */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2"
        >
          <List className="w-4 h-4" />
          {title}
          <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        {isOpen && (
          <nav className="pl-2 border-l-2 border-border/50 space-y-1 mt-1">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  setIsOpen(false);
                }}
                className={`block text-sm py-1 transition-colors ${item.level === 3 ? 'pl-4' : ''} ${activeId === item.id ? 'text-cta font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {item.text}
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <nav className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <List className="w-3.5 h-3.5" />
            {title}
          </p>
          <div className="border-l-2 border-border/50 space-y-0.5">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block text-[13px] leading-snug py-1.5 pl-3 -ml-px border-l-2 transition-colors ${item.level === 3 ? 'pl-5' : ''} ${activeId === item.id ? 'border-cta text-cta font-medium' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
              >
                {item.text}
              </a>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

// E3: Sticky mobile CTA
function StickyMobileCTA({ slug }: { slug: string }) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations();
  const { localizedPath } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-sm border-t border-border p-3 safe-area-bottom">
      <Link
        href={`${localizedPath("home")}#fleet`}
        onClick={() => trackBlogCtaClick(slug, 'sticky_mobile_cta')}
        className="block w-full bg-cta hover:bg-cta/90 text-white rounded-full py-3 text-center text-sm font-semibold btn-elevated flex items-center justify-center gap-2"
      >
        <Anchor className="w-4 h-4" />
        {t.hero?.bookNow || 'Reservar'}
      </Link>
    </div>
  );
}

// U2: Reading progress bar
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min(100, (scrollTop / docHeight) * 100));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-transparent">
      <div
        className="h-full bg-cta transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// E1: Inline newsletter CTA
function InlineNewsletterCTA({ bd, language }: { bd: Record<string, string>; language: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    trackBlogCtaClick('newsletter', 'inline_newsletter');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), language, source: 'blog_inline' }),
      });
      if (res.ok || res.status === 409) {
        setState('success');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div className="my-8 p-6 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-center">
        <p className="text-green-700 dark:text-green-400 font-medium">{bd.newsletterSuccess}</p>
      </div>
    );
  }

  return (
    <div className="my-8 p-6 rounded-xl bg-cta/5 border border-cta/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-lg mb-1">{bd.newsletterTitle}</h3>
          <p className="text-sm text-muted-foreground">{bd.newsletterSubtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <label htmlFor="blog-newsletter-email" className="sr-only">{bd.newsletterPlaceholder}</label>
          <input
            id="blog-newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={bd.newsletterPlaceholder}
            required
            className="bg-background border border-border rounded-full px-4 py-2.5 text-sm flex-1 sm:w-56 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="bg-cta hover:bg-cta/90 text-white rounded-full px-5 py-2.5 text-sm font-medium btn-elevated disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            {state === 'loading' ? '...' : bd.newsletterButton}
          </button>
        </form>
      </div>
      {state === 'error' && (
        <p className="text-xs text-red-500 mt-2">{bd.newsletterError}</p>
      )}
    </div>
  );
}

function ShareButtons({ title, url, bd, slug }: { title: string; url: string; bd: Record<string, string>; slug: string }) {
  const [copied, setCopied] = useState(false);

  const shareData = { title, url };

  const handleNativeShare = async () => {
    if (navigator.share) {
      trackBlogShare(slug, 'native');
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    trackBlogShare(slug, 'copy_link');
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="mt-10 pt-6 border-t border-border/50">
      <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        {bd.shareArticle}
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackWhatsAppClick("blog_share"); trackBlogShare(slug, 'whatsapp'); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackBlogShare(slug, 'twitter')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackBlogShare(slug, 'facebook')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </a>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? bd.linkCopied : bd.copyLink}
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors sm:hidden"
          >
            <Share2 className="w-4 h-4" />
            {bd.share}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BlogDetailPage({ slug: slugProp }: { slug?: string }) {
  const routeParams = useParams<{ slug: string }>();
  const slug = slugProp || routeParams.slug;
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const bd = t.blogDetail!;
  const [, setLocation] = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  const articleRef = useRef<HTMLElement>(null);
  const scrollMilestonesRef = useRef<Set<25 | 50 | 75 | 100>>(new Set());

  // A2: Add UTM params to internal boat links
  const addUtmToInternalUrl = useCallback((url: string): string => {
    if (url.startsWith('/barco') || url.startsWith('/barcos')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}utm_source=blog&utm_medium=article&utm_campaign=${slug || 'unknown'}`;
    }
    return url;
  }, [slug]);

  const markdownComponents = useMemo(() => ({
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const url = href || "";
      const isInternal = url.startsWith("/") || url.startsWith("#");
      if (isInternal) {
        const trackedUrl = addUtmToInternalUrl(url);
        return (
          <a
            href={trackedUrl}
            onClick={(e) => {
              e.preventDefault();
              if (url.startsWith("#")) {
                document.getElementById(url.slice(1))?.scrollIntoView({ behavior: "smooth" });
              } else {
                if (slug) trackBlogCtaClick(slug, 'internal_link');
                setLocation(trackedUrl);
              }
            }}
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    // S5: Add IDs to headings for TOC navigation
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = typeof children === 'string' ? children : String(children);
      const id = text.toLowerCase().replace(/\*\*/g, '').replace(/[^\w\sáéíóúñüàèìòùç]/g, '').replace(/\s+/g, '-');
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = typeof children === 'string' ? children : String(children);
      const id = text.toLowerCase().replace(/\*\*/g, '').replace(/[^\w\sáéíóúñüàèìòùç]/g, '').replace(/\s+/g, '-');
      return <h3 id={id} {...props}>{children}</h3>;
    },
    // U6: Improved markdown table styles
    table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-muted/50 dark:bg-muted/20" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
      <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-border" {...props}>{children}</th>
    ),
    td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
      <td className="px-4 py-3 border-b border-border/50" {...props}>{children}</td>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className="even:bg-muted/30 hover:bg-muted/50 transition-colors" {...props}>{children}</tr>
    ),
  }), [addUtmToInternalUrl, setLocation, slug]);

  // Fetch the blog post
  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug
  });

  // Fetch all posts for related and prev/next
  const { data: allPosts } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog']
  });

  // U4: Related posts improved - weighted by shared tags + category
  const relatedPosts = useMemo(() => {
    if (!allPosts || !post) return [];
    const postTags = new Set(post.tags || []);
    return allPosts
      .filter(p => p.slug !== post.slug)
      .map(p => {
        let score = 0;
        if (p.category === post.category) score += 2;
        const pTags = p.tags || [];
        for (const tag of pTags) {
          if (postTags.has(tag)) score += 3;
        }
        return { post: p, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.post);
  }, [allPosts, post]);

  // U3: Previous/Next article navigation
  const { prevPost, nextPost } = useMemo(() => {
    if (!allPosts || !post) return { prevPost: null, nextPost: null };
    const sorted = [...allPosts].sort((a, b) => {
      const da = typeof a.publishedAt === 'string' ? new Date(a.publishedAt).getTime() : (a.publishedAt?.getTime() || 0);
      const db = typeof b.publishedAt === 'string' ? new Date(b.publishedAt).getTime() : (b.publishedAt?.getTime() || 0);
      return da - db;
    });
    const currentIndex = sorted.findIndex(p => p.slug === post.slug);
    return {
      prevPost: currentIndex > 0 ? sorted[currentIndex - 1] : null,
      nextPost: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
    };
  }, [allPosts, post]);

  // A1: Track blog view on mount
  useEffect(() => {
    if (post) {
      trackBlogView(post.slug, post.title, post.category);
    }
  }, [post]);

  // A1: Track scroll depth milestones
  useEffect(() => {
    if (!post) return;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = (scrollTop / docHeight) * 100;
      const milestones: Array<25 | 50 | 75 | 100> = [25, 50, 75, 100];
      for (const m of milestones) {
        if (pct >= m && !scrollMilestonesRef.current.has(m)) {
          scrollMilestonesRef.current.add(m);
          trackBlogScroll(post.slug, m);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [post]);

  // Reset scroll milestones when slug changes
  useEffect(() => {
    scrollMilestonesRef.current = new Set();
  }, [slug]);

  // S5: Extract table of contents from content
  const tocItems = useMemo(() => {
    const content = post ? localized(post.contentByLang as Record<string, string> | null, post.content, language) : '';
    return extractHeadings(content);
  }, [post, language]);

  // S3: Extract FAQ pairs for schema
  const faqItems = useMemo(() => {
    const content = post ? localized(post.contentByLang as Record<string, string> | null, post.content, language) : '';
    return extractFAQs(content);
  }, [post, language]);

  // SEO Configuration
  const seoConfig = post ? {
    title: `${post.title} | Costa Brava Rent a Boat`,
    description: localized(post.metaDescByLang as Record<string, string> | null, post.metaDescription, language) || localized(post.excerptByLang as Record<string, string> | null, post.excerpt, language) || '',
    keywords: post.tags?.join(', ') || '',
    ogTitle: post.title,
    ogDescription: localized(post.metaDescByLang as Record<string, string> | null, post.metaDescription, language) || localized(post.excerptByLang as Record<string, string> | null, post.excerpt, language) || ''
  } : {
    title: 'Blog | Costa Brava Rent a Boat',
    description: '',
    keywords: ''
  };

  const hreflangLinks = generateHreflangLinks('blogDetail', slug);
  const canonical = generateCanonicalUrl('blogDetail', language, slug);

  // Generate Article schema
  const articleSchema = post ? generateArticleSchema({
    headline: post.title,
    slug: post.slug,
    description: post.metaDescription || post.excerpt || '',
    author: post.author,
    datePublished: typeof post.publishedAt === 'string'
      ? post.publishedAt
      : post.publishedAt?.toISOString() || post.createdAt?.toISOString() || new Date().toISOString(),
    dateModified: typeof post.updatedAt === 'string'
      ? post.updatedAt
      : post.updatedAt?.toISOString() || undefined,
    image: post.featuredImage || undefined,
    category: post.category
  }) : null;

  // S2: BreadcrumbList JSON-LD
  const breadcrumbSchema = post ? generateBreadcrumbSchema([
    { name: bd.breadcrumbHome, url: BASE_DOMAIN },
    { name: bd.breadcrumbBlog, url: `${BASE_DOMAIN}/blog` },
    { name: localizeCategory(post.category, language), url: `${BASE_DOMAIN}/blog?category=${post.category}` },
    { name: post.title, url: `${BASE_DOMAIN}/blog/${post.slug}` },
  ]) : null;

  // S3: FAQ schema (only for posts with FAQ-like headings)
  const faqSchema = faqItems.length >= 2 ? generateFAQSchema(faqItems) : null;

  // Combine schemas
  const schemas = [articleSchema, breadcrumbSchema, faqSchema].filter(Boolean);
  const combinedJsonLd = schemas.length > 1 ? schemas : schemas[0] || undefined;

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(LOCALE_MAP[language] || 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">{bd.notFoundTitle}</h2>
              <p className="text-muted-foreground mb-6">
                {bd.notFoundDescription}
              </p>
              <Button asChild data-testid="button-back-blog">
                <Link href={localizedPath("blog")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {bd.backToBlog}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* U2: Reading progress bar */}
      <ReadingProgressBar />

      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        ogImage={post?.featuredImage || undefined}
        ogType="article"
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd || undefined}
      />

      <Navigation />

      {/* E3: Sticky mobile CTA */}
      <StickyMobileCTA slug={post.slug} />

      <main id="main-content" className="flex-1 container mx-auto px-4 pt-20 sm:pt-24 lg:pt-32 pb-20 lg:pb-8 max-w-6xl">
        {/* S5/U1: Two-column layout with TOC sidebar on desktop */}
        <div className="lg:flex lg:gap-10">
          {/* Main article content */}
          <div className="flex-1 min-w-0 max-w-4xl">
            {/* Article Header */}
            <article ref={articleRef} className="space-y-6">
              <header className="space-y-4">
                <Badge
                  variant="secondary"
                  className="mb-2"
                  data-testid={`badge-category-${post.slug}`}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {localizeCategory(post.category, language)}
                </Badge>

                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
                  data-testid={`text-title-${post.slug}`}
                >
                  {localized(post.titleByLang as Record<string, string> | null, post.title, language)}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2" data-testid={`text-author-${post.slug}`}>
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-2" data-testid={`text-date-${post.slug}`}>
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.publishedAt)}
                  </div>
                  <span className="text-muted-foreground">{estimateReadingTime(post.content)} {bd.minRead}</span>
                  {post.tags && post.tags.length > 0 && (
                    <>
                      <span className="text-border">|</span>
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                            data-testid={`badge-tag-${index}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {(post.excerpt || post.excerptByLang) && (
                  <p
                    className="text-lg leading-relaxed text-muted-foreground"
                    data-testid={`text-excerpt-${post.slug}`}
                  >
                    {localized(post.excerptByLang as Record<string, string> | null, post.excerpt, language)}
                  </p>
                )}
              </header>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="my-8">
                  <img
                    src={post.featuredImage}
                    alt={localized(post.featuredImageAltByLang as Record<string, string> | null, null, language) || localized(post.titleByLang as Record<string, string> | null, post.title, language)}
                    className="w-full aspect-video object-cover rounded-lg"
                    loading="eager"
                    fetchPriority="high"
                    width={1200}
                    height={630}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/blog/barco-mar.jpg"; }}
                    data-testid={`img-featured-${post.slug}`}
                  />
                </div>
              )}

              {/* E1: Inline Newsletter CTA (before content) */}
              <InlineNewsletterCTA bd={bd} language={language} />

              {/* Mobile TOC (collapsible, shown above content) */}
              <TableOfContents items={tocItems} title={bd.tableOfContents} />

              {/* Article Content */}
              <div
                className="prose max-w-none dark:prose-invert prose-headings:font-heading prose-headings:tracking-tight prose-a:text-cta prose-a:decoration-cta/40 hover:prose-a:decoration-cta prose-img:rounded-lg prose-table:m-0"
                data-testid={`content-article-${post.slug}`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                  {localized(post.contentByLang as Record<string, string> | null, post.content, language)}
                </ReactMarkdown>
              </div>

              {/* Share Buttons */}
              <ShareButtons
                title={localized(post.titleByLang as Record<string, string> | null, post.title, language)}
                url={typeof window !== 'undefined' ? window.location.href : ''}
                bd={bd}
                slug={post.slug}
              />

              {/* U3: Previous/Next Article Navigation */}
              {(prevPost || nextPost) && (
                <nav className="mt-8 pt-6 border-t border-border/50 grid grid-cols-2 gap-4" aria-label="Article navigation">
                  {prevPost ? (
                    <Link
                      href={localizedPath("blogDetail", prevPost.slug)}
                      className="group flex flex-col gap-1 text-left"
                    >
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3" />
                        {bd.previousArticle}
                      </span>
                      <span className="text-sm font-medium line-clamp-2 group-hover:text-cta transition-colors">
                        {localized(prevPost.titleByLang as Record<string, string> | null, prevPost.title, language)}
                      </span>
                    </Link>
                  ) : <div />}
                  {nextPost ? (
                    <Link
                      href={localizedPath("blogDetail", nextPost.slug)}
                      className="group flex flex-col gap-1 text-right ml-auto"
                    >
                      <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        {bd.nextArticle}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                      <span className="text-sm font-medium line-clamp-2 group-hover:text-cta transition-colors">
                        {localized(nextPost.titleByLang as Record<string, string> | null, nextPost.title, language)}
                      </span>
                    </Link>
                  ) : <div />}
                </nav>
              )}

            </article>
          </div>

          {/* Desktop TOC sidebar */}
          <TableOfContents items={tocItems} title={bd.tableOfContents} />
        </div>

        {/* X2: Boat Quiz Widget */}
        <section className="mt-16 pt-8 border-t max-w-md mx-auto">
          <BoatQuiz source={post.slug} />
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-8 border-t max-w-4xl">
            <h2 className="text-2xl font-bold mb-6" data-testid="text-related-posts-title">
              {bd.relatedArticles}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={localizedPath("blogDetail", relatedPost.slug)}
                  className="block group"
                  data-testid={`card-related-${relatedPost.slug}`}
                >
                  <Card className="overflow-hidden hover-elevate h-full">
                    {relatedPost.featuredImage && (
                      <img
                        src={relatedPost.featuredImage}
                        alt={localized(relatedPost.featuredImageAltByLang as Record<string, string> | null, null, language) || localized(relatedPost.titleByLang as Record<string, string> | null, relatedPost.title, language)}
                        className="w-full aspect-[3/2] object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/blog/barco-mar.jpg"; }}
                      />
                    )}
                    <CardHeader className={relatedPost.featuredImage ? "pt-4" : ""}>
                      <Badge
                        variant="secondary"
                        className="w-fit mb-1 text-xs"
                        data-testid={`badge-related-category-${relatedPost.slug}`}
                      >
                        {localizeCategory(relatedPost.category, language)}
                      </Badge>
                      <CardTitle
                        className="line-clamp-2 text-base group-hover:text-cta transition-colors"
                        data-testid={`text-related-title-${relatedPost.slug}`}
                      >
                        {localized(relatedPost.titleByLang as Record<string, string> | null, relatedPost.title, language)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className="text-sm text-muted-foreground line-clamp-2"
                        data-testid={`text-related-excerpt-${relatedPost.slug}`}
                      >
                        {localized(relatedPost.excerptByLang as Record<string, string> | null, relatedPost.excerpt, language)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Related destinations */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">Destinos relacionados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href={localizedPath("locationBlanes")} className="block p-4 bg-background rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all">
            <h3 className="font-semibold mb-1">Blanes</h3>
            <p className="text-sm text-muted-foreground">Puerto base. Barcos sin licencia desde 70€/h.</p>
          </a>
          <a href={localizedPath("locationLloret")} className="block p-4 bg-background rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all">
            <h3 className="font-semibold mb-1">Lloret de Mar</h3>
            <p className="text-sm text-muted-foreground">Calas y playas a 20 min en barco desde Blanes.</p>
          </a>
          <a href={localizedPath("locationTossa")} className="block p-4 bg-background rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all">
            <h3 className="font-semibold mb-1">Tossa de Mar</h3>
            <p className="text-sm text-muted-foreground">Vila Vella medieval y las mejores calas de la Costa Brava.</p>
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
