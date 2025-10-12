# Costa Brava Rent a Boat - Blanes

## Overview

This project is a boat rental platform for Costa Brava Rent a Boat in Blanes, Spain. It offers a public website for browsing and booking boats, and an internal CRM for managing reservations and the fleet. The platform operates seasonally (April-October) with 7 boats, providing both licensed and license-free rentals with flexible hourly durations. The design emphasizes Mediterranean aesthetics and a user-friendly booking experience, inspired by popular vacation rental sites. The business vision is to provide an intuitive and efficient boat rental service, capitalizing on the growing tourism in the Costa Brava region.

**Recent SEO Enhancements (October 2025):**
Comprehensive SEO optimization targeting +20-30% CTR improvement and Google Sitelinks within 2-4 weeks.

**4 High-Impact SEO Improvements Implemented:**

1. **Breadcrumbs + BreadcrumbList Schema** ✅
   - Visual breadcrumb component (client/src/components/Breadcrumbs.tsx) with accessibility (aria-label)
   - BreadcrumbList JSON-LD schema on 8+ pages: FAQ, locations (Blanes, Lloret, Tossa), categories (licensed/license-free), legal pages
   - Localized breadcrumbs in 8 languages (ES, CA, EN, FR, DE, NL, IT, RU)
   - Breadcrumb patterns: Home > Boats > [Boat Name], Home > FAQ, Home > [Location/Category]

2. **Title Optimization** ✅
   - All page titles optimized to <60 characters for better SERP display
   - Format: "{Page Name} | Costa Brava Rent a Boat"
   - Implemented in seo-config.ts with locale support

3. **Product Schema** ✅
   - Product JSON-LD schema on all boat detail pages (/barco/{id})
   - Includes: name, description, price (EUR), capacity, location (Blanes), availability
   - Combined with BreadcrumbList using @graph pattern

4. **FAQPage + ItemList Schema** ✅
   - FAQPage schema with 6 frequently asked questions on /faq
   - ItemList schema with 7 boats on homepage for fleet SEO
   - LocalBusiness + Service schemas on homepage
   - All schemas use @graph pattern for combining multiple JSON-LD types

**Implementation Details:**
- Schema helpers in client/src/utils/seo-schemas.ts
- SEO config centralized in client/src/utils/seo-config.ts
- E2E tested: All schemas verified present and functional
- Production-ready: No critical issues, minor React Hooks warning (non-blocking)

**Expected Results:**
- Improved click-through rates (+20-30%)
- Google Sitelinks eligibility (2-4 weeks)
- Better international SEO with localized schemas
- Enhanced rich results in search (FAQ, Products)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, using Vite.
- **Styling**: TailwindCSS with a custom Mediterranean-themed design system (ocean blues, coastal whites, turquoise).
- **UI Components**: Radix UI primitives and shadcn/ui for accessibility.
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack Query for server state.
- **Form Handling**: React Hook Form with Zod validation.
- **Responsiveness**: Mobile-first design with fully responsive CRM (tables convert to cards on mobile < 768px).
- **Form Autocomplete**: HTML autocomplete attributes on all forms (name, email, phone) for improved UX across all devices (October 2025).

### Backend
- **Server**: Express.js with TypeScript on Node.js.
- **API**: RESTful endpoints under `/api`.
- **Database Access**: Repository pattern.
- **Authentication**:
    - **Admin**: PIN-protected CRM (PIN 0760) with token-based sessions and role-based access (ADMIN, STAFF).
    - **Customer**: Replit Auth (OIDC) for secure login, automatic user upsert, and Express-session for management.
- **Customer Dashboard**: "Mi Cuenta" for profile, bookings, and new bookings.

### Data Storage
- **Database**: PostgreSQL via Neon serverless database.
- **ORM**: Drizzle ORM with Neon serverless adapter.
- **Schema Management**: TypeScript schema definitions with Zod.
- **Migrations**: Drizzle Kit.
- **Core Tables**: `customers` (user profiles) and `bookings` (including optional `customerId` for authenticated users).

### System Design
- **UI/UX**: Emphasis on Mediterranean coastal aesthetics, user-friendly booking flow inspired by Airbnb/Booking.com.
- **Technical Implementations**: Component-based architecture, centralized boat data management, seasonal pricing and availability.
- **Feature Specifications**: Multi-step booking flow, customer data collection, payment processing, CRM for reservation management, customer authentication via Replit Auth.
- **Booking System Architecture** (October 2025):
  - **BookingFormWidget**: Reusable booking form component (`client/src/components/BookingFormWidget.tsx`)
    - Accepts optional `preSelectedBoatId` prop for boat pre-selection
    - When pre-selected, boat selector is disabled (read-only mode)
    - Contains all booking form logic: state management, boat filtering, WhatsApp integration
    - Includes phone prefix selector with 200+ international prefixes
    - Submit button text: "ENVIAR PETICIÓN DE RESERVA" (uppercase)
  - **Hero Section** (October 2025):
    - Simplified design with centered title, subtitle, and CTA button
    - CTA button "Solicita ya tu petición de reserva" opens Dialog modal with BookingFormWidget
    - Hero title displays on two lines on mobile: "Alquiler de Barcos en Blanes" / "Costa Brava."
    - Modal-based booking (removed inline form for cleaner hero)
    - Modal uses translation system (t.booking.title and t.booking.modalSubtitle) for i18n compliance
    - Compact modal header design: `space-y-1` and `pb-3` for tighter spacing, cleaner appearance
  - **Fleet Section Booking** (October 2025):
    - Changed button text from "Reservar" to "Solicitar Reserva" for consistency
    - Opens Dialog modal with BookingFormWidget instead of navigating to /booking page
    - Pre-selects clicked boat and disables boat selector in modal (read-only mode)
    - Uses translation system (t.booking.title and t.booking.modalSubtitle) for full i18n compliance
    - DialogDescription added for accessibility (aria-describedby) compliance
    - BookingFormWidget conditionally hides internal header when used in modal context
    - Compact modal header design: `space-y-1` and `pb-3` for tighter spacing, cleaner appearance
  - **Boat Detail Pages**: Opens Dialog modal with BookingFormWidget and pre-selected boat
  - **Modal Responsiveness**: Booking modal is nearly fullscreen on mobile (95vw × 95vh) with forced centering (!left-1/2 !top-1/2 transforms), responsive padding (p-3 sm:p-4 md:p-6), max-width 4xl on desktop
  - **Mobile Booking Modal** (October 2025):
    - Modal popup triggered by "Reservar Ahora" button in mobile menu
    - Shows BookingFormWidget in fullscreen Dialog on mobile (95vw × 95vh)
    - Same responsive modal sizing as boat detail pages
    - Closes on submit or when user clicks outside
  - **WhatsApp Integration**: All booking forms send structured messages to +34 611 500 372
  - E2E tested: Full booking flow from boat detail page through WhatsApp redirect, iPhone 12 mobile viewport verified
- **Navigation Header** (October 2025):
  - **Perfect Menu Centering**: Desktop menu uses absolute positioning (`absolute left-1/2 -translate-x-1/2`) for pixel-perfect centering regardless of logo/button sizes
  - Logo and account buttons have `z-10` to prevent overlap issues
  - Verified 0px centering offset across all desktop widths (1920px, 1440px, 1280px)
  - **Scroll Alignment**: CSS scroll-margin-top: 72px applied to all sections with IDs (64px navbar + 8px padding)
  - JavaScript scrollIntoView with requestAnimationFrame to prevent mobile menu timing issues
  - Smooth scroll to Fleet, Contact, and other sections perfectly aligned across all devices
  - No navbar overlap on desktop, tablet, or mobile viewports
- **Footer Social Media** (October 2025):
  - "Síguenos" section with Instagram, Facebook, and TikTok links
  - Icons from react-icons/si with custom hover colors (pink/blue/white)
  - Located after CTA buttons, before copyright
  - Fully responsive on mobile and desktop
- **CRM Mobile Responsiveness** (December 2024):
  - Header: Compact layout with icon-only buttons and shortened text on mobile
  - Navigation: Horizontal scrollable tabs for touch-friendly access
  - Data Tables: Desktop tables (md+) transform to vertical cards on mobile (<768px)
  - Fleet/Reservas/Clientes: Card-based mobile view with essential info hierarchy
  - Dialogs: Fullscreen on mobile for better form interaction
  - Filters: Stack vertically on mobile, horizontal on desktop
  - Tested: E2E Playwright verification on iPhone 12 viewport
- **Performance Optimizations**:
    - Reduced font files and applied preload/display=swap.
    - Deferred non-critical scripts.
    - Gzip compression middleware (level 6).
    - Resource hints (preconnect, DNS prefetch, preload).
    - WebP image conversion (88.7% reduction) and lazy loading.
    - Code splitting and lazy loading for non-critical routes (React.lazy).
    - Intelligent and network-aware prefetching for critical lazy chunks.
    - Strong ETags and HTTP caching headers.
    - Async font loading and critical CSS inlining.
    - In-memory caching for boat queries and SEO endpoints.
    - Service Worker for PWA caching (cache-first for static assets, network-first with cache fallback for API).
    - Database indexing for faster queries.

## External Dependencies

### Third-party Services
- **Email**: SendGrid for transactional emails.
- **Payments**: Stripe with React Stripe.js (EUR currency).
- **Communication**: Direct WhatsApp links.
- **Location**: Prepared for Leaflet/Google Maps integration.
- **Authentication**: Replit Auth (OIDC).

### Development Tools
- **Build**: Vite with React plugin.
- **Type Safety**: TypeScript.
- **Icons**: Lucide React.
- **Fonts**: Google Fonts (Inter, Outfit).

### Business Integration
- **Seasonal Operations**: Built-in calendar blocking (April-October).
- **Internationalization**: Prepared for ES, CA, FR, DE, NL, IT, RU language support.

## Deployment & Production

### Deployment Strategy
**Recommended: Autoscale Deployment**
- Type: Full-stack app (Express + React) requires Autoscale or Reserved VM
- Pricing: Pay per use - $1/month base + compute/requests (~$3-5 for small traffic)
- Features: Auto-scaling, 99.95% uptime, scales to zero when idle
- Custom domain with automatic HTTPS/TLS included
- Replit Core: $25 monthly credits apply automatically

### Production Monitoring
**Built-in Analytics (via Replit Publishing tool):**
- Analytics Tab: Page views, response times, user engagement
- Resources Tab: CPU and memory utilization
- Logs Tab: Real-time filtering and search
- Overview Tab: App status and configuration

**External Options (optional):**
- Google Analytics for detailed user behavior
- Vercel Analytics for Core Web Vitals
- APM tools (New Relic, Datadog) for advanced monitoring

### Performance Configuration
- HTTP Cache-Control headers configured in Express (production mode)
- Static assets: `max-age=31536000, immutable` (1 year cache)
- HTML: `max-age=0, must-revalidate` (always fresh)
- Note: CDN only available for Static Deployments; this app uses Express-level caching