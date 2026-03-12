import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, ArrowLeft, Home, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";
import { generateArticleSchema } from "@/utils/seo-schemas";
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

function ShareButtons({ title, url, bd }: { title: string; url: string; bd: Record<string, string> }) {
  const [copied, setCopied] = useState(false);

  const shareData = { title, url };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
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

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const t = useTranslations();
  const bd = t.blogDetail!;
  const [, setLocation] = useLocation();

  const markdownComponents = {
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const url = href || "";
      const isInternal = url.startsWith("/") || url.startsWith("#");
      if (isInternal) {
        return (
          <a
            href={url}
            onClick={(e) => {
              e.preventDefault();
              if (url.startsWith("#")) {
                document.getElementById(url.slice(1))?.scrollIntoView({ behavior: "smooth" });
              } else {
                setLocation(url);
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
  };

  // Fetch the blog post
  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug
  });

  // Fetch all posts for related posts
  const { data: allPosts } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog']
  });

  // Get related posts (same category, exclude current, limit 3)
  const relatedPosts = allPosts && post
    ? allPosts
        .filter(p => p.category === post.category && p.slug !== post.slug)
        .slice(0, 3)
    : [];

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

  const combinedJsonLd = articleSchema || undefined;

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
                <Link href="/blog">
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
      
      <main id="main-content" className="flex-1 container mx-auto px-4 pt-20 sm:pt-24 lg:pt-32 pb-8 max-w-4xl">
        {/* Breadcrumbs */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="w-3.5 h-3.5" />
                {bd.breadcrumbHome}
              </Link>
            </li>
            <li className="text-muted-foreground/50">/</li>
            <li>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                {bd.breadcrumbBlog}
              </Link>
            </li>
            <li className="text-muted-foreground/50">/</li>
            <li className="text-foreground font-medium">{localizeCategory(post.category, language)}</li>
          </ol>
        </nav>

        {/* Article Header */}
        <article className="space-y-6">
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
                alt={localized(post.titleByLang as Record<string, string> | null, post.title, language)}
                className="w-full aspect-video object-cover rounded-lg"
                loading="eager"
                fetchPriority="high"
                width={1200}
                height={630}
                data-testid={`img-featured-${post.slug}`}
              />
            </div>
          )}

          {/* Article Content */}
          <div
            className="prose max-w-none dark:prose-invert prose-headings:font-heading prose-headings:tracking-tight prose-a:text-cta prose-a:decoration-cta/40 hover:prose-a:decoration-cta prose-img:rounded-lg"
            data-testid={`content-article-${post.slug}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {localized(post.contentByLang as Record<string, string> | null, post.content, language)}
            </ReactMarkdown>
          </div>

          {/* Share Buttons */}
          <ShareButtons
            title={localized(post.titleByLang as Record<string, string> | null, post.title, language)}
            url={typeof window !== 'undefined' ? window.location.href : ''}
            bd={bd}
          />

        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6" data-testid="text-related-posts-title">
              {bd.relatedArticles}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="block group"
                  data-testid={`card-related-${relatedPost.slug}`}
                >
                  <Card className="overflow-hidden hover-elevate h-full">
                    {relatedPost.featuredImage && (
                      <img
                        src={relatedPost.featuredImage}
                        alt={localized(relatedPost.titleByLang as Record<string, string> | null, relatedPost.title, language)}
                        className="w-full aspect-[3/2] object-cover"
                        loading="lazy"
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

      <Footer />
    </div>
  );
}
