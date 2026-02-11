import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { generateArticleSchema } from "@/utils/seo-schemas";
import type { BlogPost } from "@shared/schema";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();

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
    description: post.metaDescription || post.excerpt || '',
    keywords: post.tags?.join(', ') || '',
    ogTitle: post.title,
    ogDescription: post.metaDescription || post.excerpt || ''
  } : {
    title: 'Blog | Costa Brava Rent a Boat',
    description: '',
    keywords: ''
  };

  const hreflangLinks = generateHreflangLinks('blogDetail', slug);
  const canonical = generateCanonicalUrl('blogDetail', language, slug);

  // Generate breadcrumb schema
  const breadcrumbSchema = post ? generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` }
  ]) : null;

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

  // Combine schemas using @graph pattern
  const combinedJsonLd = (breadcrumbSchema && articleSchema) ? {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, articleSchema]
  } : breadcrumbSchema;

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
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
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Artículo no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                El artículo que buscas no existe o ha sido eliminado.
              </p>
              <Button asChild data-testid="button-back-blog">
                <Link href="/blog">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Blog
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
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Inicio", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title }
          ]} 
        />

        {/* Back to Blog */}
        <Button 
          variant="ghost" 
          asChild 
          className="mb-6"
          data-testid="button-back-to-blog"
        >
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-3" />
            Volver al Blog
          </Link>
        </Button>

        {/* Article Header */}
        <article className="space-y-6">
          <header className="space-y-4">
            <Badge 
              variant="secondary" 
              className="mb-2"
              data-testid={`badge-category-${post.slug}`}
            >
              <Tag className="h-3 w-3 mr-1" />
              {post.category}
            </Badge>

            <h1 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              data-testid={`text-title-${post.slug}`}
            >
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2" data-testid={`text-author-${post.slug}`}>
                <User className="h-4 w-4" />
                {post.author}
              </div>
              <div className="flex items-center gap-2" data-testid={`text-date-${post.slug}`}>
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </div>
            </div>

            {post.excerpt && (
              <p 
                className="text-xl text-muted-foreground"
                data-testid={`text-excerpt-${post.slug}`}
              >
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="my-8">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-auto rounded-lg"
                data-testid={`img-featured-${post.slug}`}
              />
            </div>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            data-testid={`content-article-${post.slug}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    data-testid={`badge-tag-${index}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6" data-testid="text-related-posts-title">
              Artículos Relacionados
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Card 
                  key={relatedPost.id} 
                  className="hover-elevate"
                  data-testid={`card-related-${relatedPost.slug}`}
                >
                  <CardHeader>
                    <Badge 
                      variant="secondary" 
                      className="w-fit mb-2"
                      data-testid={`badge-related-category-${relatedPost.slug}`}
                    >
                      {relatedPost.category}
                    </Badge>
                    <CardTitle 
                      className="line-clamp-2"
                      data-testid={`text-related-title-${relatedPost.slug}`}
                    >
                      {relatedPost.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p 
                      className="text-sm text-muted-foreground line-clamp-3 mb-4"
                      data-testid={`text-related-excerpt-${relatedPost.slug}`}
                    >
                      {relatedPost.excerpt}
                    </p>
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full"
                      data-testid={`button-read-${relatedPost.slug}`}
                    >
                      <Link href={`/blog/${relatedPost.slug}`}>
                        Leer más
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
