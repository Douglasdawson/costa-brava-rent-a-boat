import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import type { BlogPost } from "@shared/schema";

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

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  const t = useTranslations();
  const bp = t.blogPage!;

  // SEO Configuration
  const seoConfig = getSEOConfig('blog', language);
  const hreflangLinks = generateHreflangLinks('blog');
  const canonical = generateCanonicalUrl('blog', language);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: bp.breadcrumbHome, url: "/" },
    { name: bp.breadcrumbBlog, url: "/blog" }
  ]);

  // Fetch all published blog posts
  const { data: posts, isLoading, isError } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog']
  });

  // Get unique categories
  const categories = posts
    ? Array.from(new Set(posts.map(p => p.category)))
    : [];

  // Filter posts by category
  const filteredPosts = selectedCategory === 'all'
    ? posts || []
    : posts?.filter(p => p.category === selectedCategory) || [];

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

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => { if (currentPage > 1) goToPage(currentPage - 1); };
  const goToNext = () => { if (currentPage < totalPages) goToPage(currentPage + 1); };

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
      <div className="min-h-screen bg-white">
        <SEO title={seoConfig.title} description={seoConfig.description} canonical={canonical} hreflang={hreflangLinks} jsonLd={breadcrumbSchema} />
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // --- Error ---
  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        <SEO title={seoConfig.title} description={seoConfig.description} canonical={canonical} hreflang={hreflangLinks} jsonLd={breadcrumbSchema} />
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{bp.errorTitle}</h2>
            <p className="text-gray-600 mb-6">{bp.errorDescription}</p>
            <Button onClick={() => window.location.reload()} size="lg" data-testid="button-reload">
              {bp.retry}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <SEO title={seoConfig.title} description={seoConfig.description} canonical={canonical} hreflang={hreflangLinks} jsonLd={breadcrumbSchema} />
      <Navigation />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-2">
        <Breadcrumbs
          items={[
            { label: bp.breadcrumbHome, href: '/' },
            { label: bp.breadcrumbBlog, href: '/blog' }
          ]}
        />
      </div>

      {/* Header — editorial style, no gradient hero */}
      <header className="container mx-auto px-4 pt-4 pb-8 md:pb-12">
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
      <WaveDivider className="text-white h-6 md:h-10 -mb-px" />

      {/* Category pills */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap" data-testid="select-category-filter">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                selectedCategory === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              {bp.allCategories}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  selectedCategory === cat
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Post count */}
          <p className="mt-4 text-sm text-muted-foreground" data-testid="text-posts-count">
            {filteredPosts.length} {filteredPosts.length === 1 ? bp.article : bp.articles}
            {selectedCategory !== 'all' && ` ${bp.inCategory} ${selectedCategory}`}
          </p>
        </div>
      </div>

      {/* Featured Post — large cinematic card, only on first page + "all" category */}
      {featuredPost && (
        <section className="bg-white pb-8 md:pb-12">
          <div className="container mx-auto px-4">
            <Link href={`/blog/${featuredPost.slug}`}>
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
                        alt={localized(featuredPost.titleByLang as Record<string, string> | null, featuredPost.title, language)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="eager"
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
                        {featuredPost.category}
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
                          {new Date(featuredPost.publishedAt).toLocaleDateString('es-ES')}
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
      <section className="bg-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          {paginatedPosts.length === 0 && !featuredPost ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">{bp.noArticles}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                {paginatedPosts.map((post, index) => {
                  // First two posts get a larger treatment
                  const isLarge = index < 2 && currentPage === 1 && selectedCategory === 'all';

                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <article
                        className={`group cursor-pointer h-full ${isLarge ? '' : ''}`}
                        data-testid={`link-blog-card-${post.slug}`}
                      >
                        {/* Image */}
                        {post.featuredImage && (
                          <div className={`relative overflow-hidden rounded-xl mb-4 ${isLarge ? 'aspect-[16/10]' : 'aspect-[16/9]'}`}>
                            <img
                              src={post.featuredImage}
                              alt={localized(post.titleByLang as Record<string, string> | null, post.title, language)}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                              data-testid={`img-blog-${post.slug}`}
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
                            {post.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {estimateReadingTime(post.content)} {bp.minRead}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className={`font-display font-semibold leading-snug text-foreground group-hover:text-primary/80 transition-colors duration-200 mb-2 ${
                            isLarge ? 'text-xl md:text-2xl' : 'text-lg'
                          }`}
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
                                {new Date(post.publishedAt).toLocaleDateString('es-ES')}
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
                })}
              </div>

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
      <WaveDivider className="text-[#faf9f7] h-6 md:h-10 -mb-px bg-white" />

      <div className="bg-[#faf9f7] h-8" />

      <Footer />
    </div>
  );
}
