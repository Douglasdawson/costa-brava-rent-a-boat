# Costa Brava Rent a Boat - Blanes

## Overview

This project is a boat rental platform for Costa Brava Rent a Boat in Blanes, Spain. It features a public website for boat browsing and booking, and an internal CRM for managing reservations and the boat fleet. The platform operates seasonally and offers both licensed and license-free rentals with flexible durations. The design emphasizes Mediterranean aesthetics and a user-friendly booking experience, aiming for an intuitive and efficient service to capitalize on Costa Brava tourism. Recent enhancements focus on comprehensive SEO for improved search visibility, rich results, and local search dominance. The business vision is to provide an intuitive and efficient boat rental service, capitalizing on the growing tourism in the Costa Brava region.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, using Vite.
- **Styling**: TailwindCSS with a custom Mediterranean design system.
- **UI Components**: Radix UI primitives and shadcn/ui.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state.
- **Form Handling**: React Hook Form with Zod validation.
- **Responsiveness**: Mobile-first design, with CRM tables converting to cards on mobile.
- **Form Autocomplete**: HTML autocomplete attributes on all forms.

### Backend
- **Server**: Express.js with TypeScript on Node.js.
- **API**: RESTful endpoints.
- **Authentication**: PIN-protected CRM (PIN 0760) with token-based sessions and role-based access; Replit Auth (OIDC) for customer login.

### Data Storage
- **Database**: PostgreSQL via Neon serverless database.
- **ORM**: Drizzle ORM with Neon serverless adapter.
- **Schema Management**: TypeScript schema definitions with Zod.
- **Migrations**: Drizzle Kit.
- **Core Tables**: `customers`, `bookings`, `boats`.
- **Dynamic Boat Management**: All boat data is managed through the CRM and served dynamically from PostgreSQL.

### System Design
- **UI/UX**: Mediterranean coastal aesthetics, user-friendly booking flow inspired by major rental platforms.
- **Technical Implementations**: Component-based architecture, centralized boat data management, seasonal pricing and availability, multi-step booking.
- **Feature Specifications**: Customer data collection, payment processing, CRM for reservation management, customer authentication.
- **Booking System Architecture**: Reusable `BookingFormWidget` supporting pre-selected boats, integrated into Hero section modals, fleet section, and boat detail pages. WhatsApp integration for booking requests. Modals are highly responsive, appearing nearly fullscreen on mobile.
- **Navigation Header**: Pixel-perfect centered desktop menu and smooth scroll alignment for sections, preventing navbar overlap.
- **Footer**: Includes social media links for Instagram, Facebook, and TikTok.
- **CRM Mobile Responsiveness**: Header, navigation, data tables, dialogs, and filters are optimized for mobile devices.
- **Performance Optimizations**: Font optimization, deferred scripts, Gzip compression, resource hints, WebP image conversion and lazy loading, code splitting, HTTP caching, in-memory caching, Service Worker for PWA, and database indexing.
- **SEO Enhancements**: 
  - **Schemas**: Comprehensive JSON-LD implementation (BreadcrumbList, Product, FAQPage, ItemList, LocalBusiness, Service, AggregateRating, Article, Place/TouristAttraction)
  - **Offer Schema**: Enhanced with seasonal pricing (ALTA/MEDIA/BAJA), validFrom/validThrough dates, priceValidUntil, availability, and eligibleRegion. Known limitation: disjoint date ranges are merged into continuous ranges (future enhancement planned)
  - **Sitemaps**: Specialized sitemap system with sitemap index (/sitemap.xml) referencing 4 specialized sitemaps:
    - /sitemap-pages.xml: Static pages with 8 language variants
    - /sitemap-boats.xml: Dynamic boats with image tags for Google Images SEO
    - /sitemap-blog.xml: Blog listing and published posts
    - /sitemap-destinations.xml: Dynamic destinations with image tags
  - **Image SEO**: Image sitemap tags with descriptive captions and titles for boats and destinations
  - **Multi-language**: 8 language variants (ES, EN, CA, FR, DE, NL, IT, RU) in sitemaps
  - **Content**: Optimized page titles, meta descriptions (<160 chars), and alt text with keyword and geo-localization
  - **Landing Pages**: Blog and Destination pages with structured content and schemas
  - **Technical SEO (Oct 2025)**:
    - robots.txt: Optimized static file with crawl directives, sitemap location, admin blocking
    - Canonical URLs: Clean URLs without language query params; language variants via hreflang only
    - HTTPS Enforcement: Canonical domain redirect middleware (costabravarentaboat.app) with trust proxy
    - SEO Validation: Automated check-seo.mjs script with jsdom for canonical/hreflang verification
    - Dynamic Pages: Fixed blog/destination detail canonical URLs to use pageName+params pattern

## WhatsApp AI Chatbot

### Architecture
- **AI Model**: OpenAI gpt-4o-mini with function calling
- **RAG System**: text-embedding-3-small for semantic search over knowledge base
- **Database Tables**: 
  - `ai_chat_sessions`: Conversation context, lead scoring, intent tracking
  - `ai_chat_messages`: Message history with detected intents and sentiment
  - `knowledge_base`: FAQs, policies, routes with vector embeddings

### Features
- **Natural Language Understanding**: Conversational AI understands context and intent
- **Function Calling**: Real-time queries for boat availability, pricing, and details
- **RAG Knowledge Retrieval**: Semantic search for FAQs, policies, recommended routes
- **Lead Scoring**: Automatic intent detection (booking_request=30, availability=20, price_inquiry=15)
- **Boat Images**: Sends boat photos when user asks about specific boats
- **Memory System**: Persistent conversation history across sessions

### API Endpoints
- `POST /api/whatsapp/webhook`: Main Twilio webhook for messages
- `GET /api/chatbot/analytics`: Metrics dashboard (sessions, leads, intents)
- `GET /api/chatbot/leads`: Hot/warm/cold leads for CRM
- `GET /api/chatbot/conversations`: Recent conversations list
- `GET /api/chatbot/knowledge`: Knowledge base entries

### Key Files
- `server/whatsapp/aiService.ts`: OpenAI integration and response generation
- `server/whatsapp/ragService.ts`: Embedding generation and semantic search
- `server/whatsapp/chatMemoryService.ts`: Session management and lead scoring
- `server/whatsapp/functionCallingService.ts`: Availability and pricing queries
- `server/whatsapp/seedKnowledgeBase.ts`: Auto-populates FAQs on startup

## External Dependencies

### Third-party Services
- **Email**: SendGrid.
- **Payments**: Stripe with React Stripe.js.
- **Communication**: WhatsApp via Twilio with AI-powered chatbot.
- **AI/LLM**: OpenAI (gpt-4o-mini, text-embedding-3-small).
- **Authentication**: Replit Auth (OIDC).

### Development Tools
- **Build**: Vite with React plugin.
- **Type Safety**: TypeScript.
- **Icons**: Lucide React.
- **Fonts**: Google Fonts (Inter, Outfit).

### Business Integration
- **Seasonal Operations**: Built-in calendar blocking (April-October).
- **Internationalization**: Prepared for ES, CA, FR, DE, NL, IT, RU language support.