import {
  db, eq, and,
  testimonials, blogPosts, destinations, newsletterSubscribers,
  type Testimonial, type InsertTestimonial,
  type BlogPost, type InsertBlogPost,
  type Destination, type InsertDestination,
  type NewsletterSubscriber,
} from "./base";

// ===== TESTIMONIAL METHODS =====

export async function getTestimonials(): Promise<Testimonial[]> {
  return await db.select().from(testimonials).where(eq(testimonials.isVerified, true));
}

export async function getTestimonialsByBoat(boatId: string): Promise<Testimonial[]> {
  return await db.select()
    .from(testimonials)
    .where(and(
      eq(testimonials.boatId, boatId),
      eq(testimonials.isVerified, true)
    ));
}

export async function createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
  const [testimonial] = await db
    .insert(testimonials)
    .values(insertTestimonial)
    .returning();
  return testimonial;
}

// ===== BLOG POST METHODS =====

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return await db.select().from(blogPosts);
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  return await db.select()
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true));
}

export async function getBlogPost(id: string): Promise<BlogPost | undefined> {
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  return post || undefined;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
  return post || undefined;
}

export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  return await db.select()
    .from(blogPosts)
    .where(and(
      eq(blogPosts.category, category),
      eq(blogPosts.isPublished, true)
    ));
}

export async function createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
  const [post] = await db
    .insert(blogPosts)
    .values({
      ...insertPost,
      publishedAt: insertPost.isPublished ? new Date() : null
    })
    .returning();
  return post;
}

export async function updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
  const updateData: Record<string, unknown> = { ...updates, updatedAt: new Date() };

  if (updates.isPublished === true) {
    const existing = await getBlogPost(id);
    if (existing && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const [post] = await db
    .update(blogPosts)
    .set(updateData)
    .where(eq(blogPosts.id, id))
    .returning();
  return post || undefined;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

// ===== DESTINATION METHODS =====

export async function getAllDestinations(): Promise<Destination[]> {
  return await db.select().from(destinations);
}

export async function getPublishedDestinations(): Promise<Destination[]> {
  return await db.select()
    .from(destinations)
    .where(eq(destinations.isPublished, true));
}

export async function getDestination(id: string): Promise<Destination | undefined> {
  const [destination] = await db.select().from(destinations).where(eq(destinations.id, id));
  return destination || undefined;
}

export async function getDestinationBySlug(slug: string): Promise<Destination | undefined> {
  const [destination] = await db.select().from(destinations).where(eq(destinations.slug, slug));
  return destination || undefined;
}

export async function createDestination(insertDestination: InsertDestination): Promise<Destination> {
  const [destination] = await db
    .insert(destinations)
    .values(insertDestination)
    .returning();
  return destination;
}

export async function updateDestination(id: string, updates: Partial<InsertDestination>): Promise<Destination | undefined> {
  const [destination] = await db
    .update(destinations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(destinations.id, id))
    .returning();
  return destination || undefined;
}

export async function deleteDestination(id: string): Promise<boolean> {
  const result = await db.delete(destinations).where(eq(destinations.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

// ===== NEWSLETTER =====

export async function createNewsletterSubscriber(email: string, language: string, source: string): Promise<NewsletterSubscriber> {
  const [subscriber] = await db
    .insert(newsletterSubscribers)
    .values({ email: email.toLowerCase().trim(), language, source })
    .returning();
  return subscriber;
}
