// Single source of truth for blog/article author profiles.
// Used by both client (seo-schemas.ts) and server (seoInjector.ts) to emit
// schema.org Person markup for E-E-A-T (Experience, Expertise, Authority, Trust).
//
// To add a new author: append to AUTHORS and reference by `slug` from blog
// posts (post.authorSlug). Falls back to DEFAULT_AUTHOR when no slug is set.

export interface AuthorProfile {
  slug: string;
  name: string;
  jobTitle: string;
  bio: string;
  image: string;
  url: string;
  sameAs: string[];
  email?: string;
}

export const DEFAULT_AUTHOR: AuthorProfile = {
  slug: "ivan-ramirez-dawson",
  name: "Iván Ramírez Dawson",
  jobTitle: "Founder, Costa Brava Rent a Boat",
  bio: "Fundador de Costa Brava Rent a Boat. Operador náutico en el Puerto de Blanes desde 2018, especializado en alquiler de barcos sin licencia y excursiones privadas por la Costa Brava sur (Blanes, Lloret de Mar, Tossa de Mar).",
  image: "/images/team/ivan-ramirez-dawson.webp",
  url: "https://www.costabravarentaboat.com/sobre-nosotros",
  sameAs: [
    "https://www.instagram.com/costabravarentaboat/",
    "https://www.facebook.com/costabravarentaboat",
    "https://www.tiktok.com/@costabravarentaboat",
    "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
  ],
};

export const AUTHORS: Record<string, AuthorProfile> = {
  "ivan-ramirez-dawson": DEFAULT_AUTHOR,
};

export function getAuthor(slug?: string | null): AuthorProfile {
  if (!slug) return DEFAULT_AUTHOR;
  return AUTHORS[slug] ?? DEFAULT_AUTHOR;
}

export function authorToPersonSchema(
  author: AuthorProfile,
  baseUrl: string,
): Record<string, unknown> {
  const absImage = author.image.startsWith("http")
    ? author.image
    : `${baseUrl}${author.image}`;
  return {
    "@type": "Person",
    "@id": `${baseUrl}/#author-${author.slug}`,
    name: author.name,
    url: author.url.startsWith("http") ? author.url : `${baseUrl}${author.url}`,
    jobTitle: author.jobTitle,
    description: author.bio,
    image: absImage,
    sameAs: author.sameAs,
    worksFor: {
      "@type": "Organization",
      name: "Costa Brava Rent a Boat",
      url: baseUrl,
    },
  };
}
