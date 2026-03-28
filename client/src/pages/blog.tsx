import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ChevronLeft, ChevronRight, ArrowRight, Anchor } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useTranslations } from "@/lib/translations";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";
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
  'Rutas': { es: 'Rutas', en: 'Routes', ca: 'Rutes', fr: 'Itinéraires', de: 'Routen', nl: 'Routes', it: 'Percorsi', ru: 'Маршруты' },
};

/** Normalize common category typos (e.g. "Guias" without accent) to the canonical form */
const CATEGORY_ALIASES: Record<string, string> = {
  'Guias': 'Guías',
};

function normalizeCategory(category: string): string {
  return CATEGORY_ALIASES[category] || category;
}

function localizeCategory(category: string, lang: string): string {
  const normalized = normalizeCategory(category);
  return CATEGORY_TRANSLATIONS[normalized]?.[lang] || normalized;
}

const POSTS_PER_PAGE = 8;

function localized(byLang: Record<string, string> | null | undefined, fallback: string | null | undefined, lang: string): string {
  if (byLang && byLang[lang]) return byLang[lang];
  return fallback || "";
}

function estimateReadingTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

/** Wavy SVG divider — the one visual signature of the page */
function WaveDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0 24C120 8 240 40 360 24C480 8 600 40 720 24C840 8 960 40 1080 24C1200 8 1320 40 1440 24V48H0V24Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Memo'd category pill button to avoid re-renders when other categories change */
const CategoryButton = React.memo(function CategoryButton({
  category,
  isSelected,
  label,
  onSelect,
}: {
  category: string;
  isSelected: boolean;
  label: string;
  onSelect: (cat: string) => void;
}) {
  const handleClick = useCallback(() => onSelect(category), [onSelect, category]);
  return (
    <button
      onClick={handleClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
        isSelected
          ? 'bg-foreground text-background border-foreground'
          : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
});

/** Memo'd blog post card rendered inside .map() to avoid unnecessary re-renders */
const BlogPostCard = React.memo(function BlogPostCard({
  post,
  language,
  bp,
}: {
  post: BlogPost;
  language: string;
  bp: Record<string, string>;
}) {
  const { localizedPath } = useLanguage();
  return (
    <Link href={localizedPath("blogDetail", post.slug)}>
      <article
        className="group cursor-pointer h-full"
        data-testid={`link-blog-card-${post.slug}`}
      >
        {/* Image */}
        {post.featuredImage && (
          <div className="relative overflow-hidden rounded-xl mb-4 aspect-[16/9]">
            <img
              src={post.featuredImage}
              alt={localized(post.featuredImageAltByLang as Record<string, string> | null, null, language) || localized(post.titleByLang as Record<string, string> | null, post.title, language)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              width={800}
              height={450}
              data-testid={`img-blog-${post.slug}`}
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/blog/barco-mar.jpg"; }}
            />
            {/* Subtle bottom gradient for depth */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Meta line */}
        <div className="flex items-center gap-3 mb-2.5">
          <Badge
            variant="secondary"
            className="text-xs font-medium"
            data-testid={`badge-category-${post.slug}`}
          >
            {localizeCategory(post.category, language)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {estimateReadingTime(post.content)} {bp.minRead}
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-display font-semibold leading-snug text-foreground group-hover:text-primary/80 transition-colors duration-200 mb-2 text-lg"
          data-testid={`text-title-${post.slug}`}
        >
          {localized(post.titleByLang as Record<string, string> | null, post.title, language)}
        </h3>

        {/* Excerpt */}
        {(post.excerpt || post.excerptByLang) && (
          <p
            className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3"
            data-testid={`text-excerpt-${post.slug}`}
          >
            {localized(post.excerptByLang as Record<string, string> | null, post.excerpt, language)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" data-testid={`text-author-${post.slug}`}>
              <User className="w-3.5 h-3.5" />
              {post.author}
            </span>
            {post.publishedAt && (
              <span className="flex items-center gap-1" data-testid={`text-date-${post.slug}`}>
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.publishedAt).toLocaleDateString(LOCALE_MAP[language] || 'es-ES')}
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-foreground/60 group-hover:text-[hsl(var(--cta))] transition-colors flex items-center gap-1">
            {bp.readMore}
            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-muted-foreground/60" data-testid={`text-tag-${tag}-${post.slug}`}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
});

/** Inline CTA banner inserted between blog post rows */
function BlogListCtaBanner({ bp }: { bp: Record<string, string> }) {
  const { openBookingModal } = useBookingModal();

  return (
    <div
      className="col-span-full bg-muted/50 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
      data-testid="blog-list-cta-banner"
    >
      <p className="font-heading font-semibold text-foreground text-center sm:text-left">
        {bp.ctaBanner || 'Ya sabes que barco quieres? Reserva desde 70\u20AC/h'}
      </p>
      <Button
        size="lg"
        className="bg-cta hover:bg-cta/90 text-white rounded-full px-8 font-semibold btn-elevated shrink-0"
        onClick={() => openBookingModal()}
        data-testid="button-blog-list-cta"
      >
        <Anchor className="w-4 h-4 mr-2" />
        {bp.ctaBannerButton || 'Reservar ahora'}
      </Button>
    </div>
  );
}

/** Post grid with CTA banner injected after every 6 posts */
function BlogPostGrid({ posts, language, bp }: { posts: BlogPost[]; language: string; bp: Record<string, string> }) {
  const CTA_INTERVAL = 6;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
      {posts.map((post, index) => (
        <React.Fragment key={post.id}>
          <BlogPostCard post={post} language={language} bp={bp} />
          {(index + 1) % CTA_INTERVAL === 0 && index + 1 < posts.length && (
            <BlogListCtaBanner bp={bp} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const bp = t.blogPage!;

  // SEO Configuration
  const seoConfig = getSEOConfig('blog', language);
  const hreflangLinks = generateHreflangLinks('blog');
  const canonical = generateCanonicalUrl('blog', language);

  // Fetch all published blog posts
  const { data: posts, isLoading, isError } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog']
  });

  // Get unique categories (normalized to avoid duplicates like "Guias" vs "Guías")
  const categories = posts
    ? Array.from(new Set(posts.map(p => normalizeCategory(p.category))))
    : [];

  // Filter posts by category (compare normalized values)
  const filteredPosts = selectedCategory === 'all'
    ? posts || []
    : posts?.filter(p => normalizeCategory(p.category) === selectedCategory) || [];

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Separate featured post (most recent) from the rest
  const featuredPost = selectedCategory === 'all' && currentPage === 1 && filteredPosts.length > 0
    ? filteredPosts[0]
    : null;

  const gridPosts = featuredPost
    ? filteredPosts.slice(1)
    : filteredPosts;

  // Pagination on grid posts only
  const totalPages = Math.ceil(gridPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = gridPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToPrevious = useCallback(() => { if (currentPage > 1) goToPage(currentPage - 1); }, [currentPage, goToPage]);
  const goToNext = useCallback(() => { if (currentPage < totalPages) goToPage(currentPage + 1); }, [currentPage, totalPages, goToPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...', totalPages);
    }
    return pages;
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <main id="main-content" className="min-h-screen bg-muted/30">
        <SEO title={seoConfig.title} description={seoConfig.description} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} />
        <Navigation />
        {/* Skeleton header */}
        <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 md:pb-12">
          <div className="max-w-3xl space-y-4">
            <div className="h-10 md:h-14 bg-muted animate-pulse rounded-lg w-2/3" />
            <div className="h-5 bg-muted animate-pulse rounded w-full max-w-2xl" />
          </div>
        </div>
        {/* Skeleton category pills */}
        <div className="bg-background">
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-2">
              {[80, 100, 90, 110, 70].map((w, i) => (
                <div key={i} className="h-9 bg-muted animate-pulse rounded-full shrink-0" style={{ width: w }} />
              ))}
            </div>
          </div>
        </div>
        {/* Skeleton grid */}
        <div className="bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[16/9] bg-muted animate-pulse rounded-xl" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-6 bg-muted animate-pulse rounded w-5/6" />
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // --- Error ---
  if (isError) {
    return (
      <main id="main-content" className="min-h-screen bg-background">
        <SEO title={seoConfig.title} description={seoConfig.description} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} />
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">{bp.errorTitle}</h2>
            <p className="text-muted-foreground mb-6">{bp.errorDescription}</p>
            <Button onClick={() => window.location.reload()} size="lg" data-testid="button-reload">
              {bp.retry}
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-muted/30">
      <SEO title={seoConfig.title} description={seoConfig.description} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} />
      <Navigation />

      {/* Header — editorial style, no gradient hero */}
      <header className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 md:pb-12">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {bp.title}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            {bp.subtitle}
          </p>
        </div>
      </header>

      {/* Wave separator */}
      <WaveDivider className="text-background h-6 md:h-10 -mb-px" />

      {/* Category pills */}
      <div className="bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap" data-testid="select-category-filter">
            <CategoryButton
              category="all"
              isSelected={selectedCategory === 'all'}
              label={bp.allCategories}
              onSelect={handleCategorySelect}
            />
            {categories.map(cat => (
              <CategoryButton
                key={cat}
                category={cat}
                isSelected={selectedCategory === cat}
                label={localizeCategory(cat, language)}
                onSelect={handleCategorySelect}
              />
            ))}
          </div>

          {/* Post count */}
          <p className="mt-4 text-sm text-muted-foreground" data-testid="text-posts-count">
            {filteredPosts.length} {filteredPosts.length === 1 ? bp.article : bp.articles}
            {selectedCategory !== 'all' && ` ${bp.inCategory} ${localizeCategory(selectedCategory, language)}`}
          </p>
        </div>
      </div>

      {/* Featured Post — large cinematic card, only on first page + "all" category */}
      {featuredPost && (
        <section className="bg-background pb-8 md:pb-12">
          <div className="container mx-auto px-4">
            <Link href={localizedPath("blogDetail", featuredPost.slug)}>
              <article
                className="group relative bg-foreground rounded-2xl overflow-hidden cursor-pointer"
                data-testid={`link-blog-card-${featuredPost.slug}`}
              >
                <div className="grid md:grid-cols-2 min-h-[320px] md:min-h-[420px]">
                  {/* Image side */}
                  <div className="relative overflow-hidden">
                    {featuredPost.featuredImage ? (
                      <img
                        src={featuredPost.featuredImage}
                        alt={localized(featuredPost.featuredImageAltByLang as Record<string, string> | null, null, language) || localized(featuredPost.titleByLang as Record<string, string> | null, featuredPost.title, language)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="eager"
                        fetchPriority="high"
                        width={1200}
                        height={630}
                        data-testid={`img-blog-${featuredPost.slug}`}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
                    )}
                    {/* Gradient fade into text side on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent via-transparent to-foreground/90 md:to-foreground" />
                  </div>

                  {/* Text side */}
                  <div className="relative flex flex-col justify-center p-6 md:p-10 lg:p-14 text-primary-foreground">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest bg-white/15 rounded-full backdrop-blur-sm">
                        {bp.featuredArticle}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-white/15 text-white border-0 backdrop-blur-sm"
                        data-testid={`badge-category-${featuredPost.slug}`}
                      >
                        {localizeCategory(featuredPost.category, language)}
                      </Badge>
                    </div>

                    <h2
                      className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4"
                      data-testid={`text-title-${featuredPost.slug}`}
                    >
                      {localized(featuredPost.titleByLang as Record<string, string> | null, featuredPost.title, language)}
                    </h2>

                    {(featuredPost.excerpt || featuredPost.excerptByLang) && (
                      <p className="text-white/70 text-base md:text-lg leading-relaxed line-clamp-3 mb-6" data-testid={`text-excerpt-${featuredPost.slug}`}>
                        {localized(featuredPost.excerptByLang as Record<string, string> | null, featuredPost.excerpt, language)}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-white/50 mt-auto">
                      <span className="flex items-center gap-1.5" data-testid={`text-author-${featuredPost.slug}`}>
                        <User className="w-3.5 h-3.5" />
                        {featuredPost.author}
                      </span>
                      {featuredPost.publishedAt && (
                        <span className="flex items-center gap-1.5" data-testid={`text-date-${featuredPost.slug}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(featuredPost.publishedAt).toLocaleDateString(LOCALE_MAP[language] || 'es-ES')}
                        </span>
                      )}
                      <span>{estimateReadingTime(featuredPost.content)} {bp.minRead}</span>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        </section>
      )}

      {/* Post Grid — mixed layout */}
      <section className="bg-background py-8 md:py-12">
        <div className="container mx-auto px-4">
          {paginatedPosts.length === 0 && !featuredPost ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground text-lg">{bp.noArticles}</p>
              {selectedCategory !== 'all' && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedCategory('all')}
                  className="rounded-full"
                >
                  {bp.allCategories}
                </Button>
              )}
            </div>
          ) : (
            <>
              <BlogPostGrid posts={paginatedPosts} language={language} bp={bp} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    data-testid="button-pagination-prev"
                    aria-label={bp.prevPage}
                    className="rounded-full"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        onClick={() => goToPage(page as number)}
                        data-testid={`button-pagination-${page}`}
                        aria-label={`${bp.goToPage} ${page}`}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`rounded-full w-10 h-10 ${currentPage === page ? '' : 'text-muted-foreground'}`}
                      >
                        {page}
                      </Button>
                    )
                  ))}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    data-testid="button-pagination-next"
                    aria-label={bp.nextPage}
                    className="rounded-full"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Bottom wave before footer */}
      <WaveDivider className="text-muted h-6 md:h-10 -mb-px bg-background" />

      <div className="bg-muted/30 h-8" />

      <Footer />
    </main>
  );
}

export default React.memo(BlogPage);
