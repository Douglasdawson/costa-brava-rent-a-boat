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
- **SEO Enhancements**: Comprehensive SEO schema implementation (BreadcrumbList, Product, FAQPage, ItemList, LocalBusiness, Service, AggregateRating, Article, Place/TouristAttraction), dynamic sitemap generation (including boats, blog posts, destinations, and 8 language variants), optimized page titles, meta descriptions, and alt text for images with keyword and geo-localization. Enhanced Offer Schema includes seasonal pricing and dynamic `priceValidUntil` for better rich results. Blog and Destination landing pages provide structured content and schemas.

## External Dependencies

### Third-party Services
- **Email**: SendGrid.
- **Payments**: Stripe with React Stripe.js.
- **Communication**: Direct WhatsApp links.
- **Authentication**: Replit Auth (OIDC).

### Development Tools
- **Build**: Vite with React plugin.
- **Type Safety**: TypeScript.
- **Icons**: Lucide React.
- **Fonts**: Google Fonts (Inter, Outfit).

### Business Integration
- **Seasonal Operations**: Built-in calendar blocking (April-October).
- **Internationalization**: Prepared for ES, CA, FR, DE, NL, IT, RU language support.