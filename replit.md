# Costa Brava Rent a Boat - Blanes

## Overview

This project is a boat rental platform for Costa Brava Rent a Boat in Blanes, Spain. It offers a public website for browsing and booking boats, and an internal CRM for managing reservations and the fleet. The platform operates seasonally (April-October) with 7 boats, providing both licensed and license-free rentals with flexible hourly durations. The design emphasizes Mediterranean aesthetics and a user-friendly booking experience, inspired by popular vacation rental sites. The business vision is to provide an intuitive and efficient boat rental service, capitalizing on the growing tourism in the Costa Brava region.

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
  - **Hero Section**: Uses BookingFormWidget for homepage booking form
  - **Boat Detail Pages**: Opens Dialog modal with BookingFormWidget and pre-selected boat
  - **Modal Responsiveness**: Booking modal is nearly fullscreen on mobile (95vw × 95vh) with forced centering (!left-1/2 !top-1/2 transforms), responsive padding (p-3 sm:p-4 md:p-6), max-width 4xl on desktop
  - **Mobile Booking Modal** (October 2025):
    - Modal popup triggered by "Reservar Ahora" button in mobile menu
    - Shows BookingFormWidget in fullscreen Dialog on mobile (95vw × 95vh)
    - Same responsive modal sizing as boat detail pages
    - Closes on submit or when user clicks outside
  - **WhatsApp Integration**: All booking forms send structured messages to +34 611 500 372
  - E2E tested: Full booking flow from boat detail page through WhatsApp redirect, iPhone 12 mobile viewport verified
- **Navigation Scroll Alignment** (October 2025):
  - CSS scroll-margin-top: 72px applied to all sections with IDs (64px navbar + 8px padding)
  - JavaScript scrollIntoView with requestAnimationFrame to prevent mobile menu timing issues
  - Smooth scroll to Fleet, Contact, and other sections perfectly aligned across all devices
  - No navbar overlap on desktop, tablet, or mobile viewports
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