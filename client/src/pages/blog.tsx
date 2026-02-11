import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import type { BlogPost } from "@shared/schema";

const POSTS_PER_PAGE = 9;

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();

  // SEO Configuration
  const seoConfig = getSEOConfig('blog', language);
  const hreflangLinks = generateHreflangLinks('blog');
  const canonical = generateCanonicalUrl('blog', language);
  
  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Blog", url: "/blog" }
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

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO 
          title={seoConfig.title}
          description={seoConfig.description}
          canonical={canonical}
          hreflang={hreflangLinks}
          jsonLd={breadcrumbSchema}
        />
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        <SEO 
          title={seoConfig.title}
          description={seoConfig.description}
          canonical={canonical}
          hreflang={hreflangLinks}
          jsonLd={breadcrumbSchema}
        />
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar artículos</h2>
            <p className="text-gray-600 mb-6">
              No pudimos cargar los artículos del blog en este momento. Por favor, intenta de nuevo más tarde.
            </p>
            <Button
              onClick={() => window.location.reload()}
              size="lg"
              data-testid="button-reload"
            >
              Reintentar
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={breadcrumbSchema}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs 
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Blog', href: '/blog' }
            ]}
          />
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Blog de Navegación
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            Guías, consejos y destinos para disfrutar al máximo de tu experiencia en barco por la Costa Brava
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-gray-600" data-testid="text-posts-count">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'artículo' : 'artículos'}
              {selectedCategory !== 'all' && ` en ${selectedCategory}`}
            </p>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {paginatedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay artículos en esta categoría</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" data-testid={`link-blog-card-${post.slug}`}>
                    {post.featuredImage && (
                      <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                          data-testid={`img-blog-${post.slug}`}
                        />
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" data-testid={`badge-category-${post.slug}`}>{post.category}</Badge>
                      </div>
                      <CardTitle className="text-xl hover:text-primary transition-colors" data-testid={`text-title-${post.slug}`}>
                        {post.title}
                      </CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-2" data-testid={`text-excerpt-${post.slug}`}>
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1" data-testid={`text-author-${post.slug}`}>
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        {post.publishedAt && (
                          <div className="flex items-center gap-1" data-testid={`text-date-${post.slug}`}>
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.publishedAt).toLocaleDateString('es-ES')}</span>
                          </div>
                        )}
                      </div>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Tag className="w-4 h-4 text-gray-400" />
                          {post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs text-gray-500" data-testid={`text-tag-${tag}-${post.slug}`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  data-testid="button-pagination-prev"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => goToPage(page as number)}
                      data-testid={`button-pagination-${page}`}
                      aria-label={`Ir a página ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
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
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
