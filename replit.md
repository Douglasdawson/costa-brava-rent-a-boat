# Costa Brava Rent a Boat - Blanes

## Overview

This is a boat rental platform for Costa Brava Rent a Boat in Blanes, Spain. The application provides a public-facing website for customers to browse and book boats, along with an internal CRM system for managing reservations and fleet operations. The business operates seasonally (April-October) with a fleet of 7 boats, offering both licensed and license-free rentals with flexible hourly durations. The platform emphasizes Mediterranean coastal aesthetics and user-friendly booking experiences inspired by vacation rental platforms like Airbnb and Booking.com.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: TailwindCSS with custom Mediterranean-themed design system featuring ocean blues, coastal whites, and turquoise accents
- **Component Library**: Radix UI primitives with shadcn/ui components for consistent, accessible UI elements
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management with custom query client configuration
- **Design System**: Centralized color palette with CSS custom properties for light/dark theme support

### Backend Architecture
- **Server**: Express.js with TypeScript running in Node.js environment
- **API Structure**: RESTful endpoints with `/api` prefix, organized through route registration system
- **Database Access**: Repository pattern implemented through storage interface with database-specific implementations
- **Development Setup**: Vite integration for hot module replacement and development middleware
- **Customer API Endpoints**:
  - `GET /api/customer/profile`: Retrieve authenticated customer profile
  - `PATCH /api/customer/profile`: Update customer profile with validation
  - `GET /api/customer/bookings`: Fetch customer booking history with fallback to email/phone matching
- **Authentication Endpoints**:
  - `GET /api/auth/callback`: Replit Auth OIDC callback handler with customer upsert
  - `GET /api/auth/me`: Check customer authentication status
  - `GET /api/auth/logout`: Customer logout with session destruction

### Data Storage Solutions
- **Database**: PostgreSQL using Neon serverless database with connection pooling
- **ORM**: Drizzle ORM with Neon serverless adapter for type-safe database operations
- **Schema Management**: Centralized schema definitions in TypeScript with Zod validation
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Customer Data**: `customers` table with user profiles (userId, firstName, lastName, email, phonePrefix, phoneNumber, nationality, documentType, documentNumber)
- **Booking Integration**: `bookings` table includes optional `customerId` field for authenticated customer bookings with fallback to guest booking data (customerEmail, customerPhone)

### Authentication and Authorization
#### Admin Authentication
- **CRM Access**: Admin panel accessible via "Admin" button in header navigation (both desktop and mobile)
- **PIN Authentication**: CRM protected with PIN (0760) for secure access
- **Session Management**: Token-based sessions stored in sessionStorage with automatic expiration handling
- **Middleware Protection**: All admin endpoints secured with requireAdminSession middleware
- **Role-based Access**: Designed for ADMIN and STAFF roles for CRM access

#### Customer Authentication
- **Authentication Provider**: Replit Auth (OIDC) for secure customer authentication
- **Session Management**: Express-session with MemoryStore for customer sessions
- **User Management**: Automatic customer record creation/update on login via user upsert
- **Profile Access**: "Mi Cuenta" button in navigation (visible only when authenticated) links to customer dashboard
- **Customer Dashboard**: Three-tab interface (Profile, Bookings, New Booking) for account management
- **Auto-fill Integration**: BookingFlow detects authenticated users and pre-fills customer data from profile
- **Protected Routes**: Customer endpoints secured with requireCustomerSession middleware
- **Database Integration**: Customer table with userId (Replit Auth), personal details, and booking history

### Component Architecture
- **Reusable Components**: Modular component structure with examples directory for documentation
- **Business Logic**: Centralized boat data management with seasonal pricing and availability
- **Form Handling**: React Hook Form integration with Zod schema validation
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## External Dependencies

### Third-party Services
- **Email Communications**: SendGrid integration for transactional emails
- **Payment Processing**: Stripe integration with React Stripe.js for secure payment handling (EUR currency)
- **WhatsApp Integration**: Direct WhatsApp links for customer communication with business phone number
- **Maps**: Prepared for location services (Leaflet/Google Maps integration)

### Development Tools
- **Build System**: Vite with React plugin and runtime error overlay
- **Type Safety**: TypeScript with strict configuration and path mapping
- **Code Quality**: ESLint and Prettier configurations (implied by component structure)
- **Asset Management**: Static asset handling through Vite with image imports

### UI and Styling
- **Icon Library**: Lucide React for consistent iconography
- **Font System**: Google Fonts (Inter for body text, Outfit for headings)
- **Animation**: CSS transitions and transforms with TailwindCSS utilities
- **Accessibility**: Radix UI primitives ensure ARIA compliance and keyboard navigation

### Business Integration
- **Seasonal Operations**: Built-in seasonal calendar blocking (April-October operational period)
- **Multi-language Support**: Prepared for ES, CA, FR, DE, NL, IT, RU language support
- **Fleet Management**: Centralized boat data with specifications, pricing, and availability
- **Booking System**: Multi-step booking flow with extras, customer data collection, and payment processing

## Performance Optimizations

### Recent Changes (October 2025)
Implemented comprehensive performance optimizations to improve Lighthouse Performance Score and user experience:

#### Achieved Results
- **Performance Score**: Improved from 36% to 59% (+64% improvement)
- **Market Position**: #1 among local competitors (vs BlanesBoats.com: 34%, RentaBoatBlanes.com: 28%)
- **Total Blocking Time**: Reduced from 1,070ms to 0ms (perfect score)
- **Maintained**: Perfect CLS score of 0 (no layout shifts)

#### Optimizations Applied
1. **Font Loading Optimization**
   - Reduced Google Fonts from 12 to 8 files (-33% reduction)
   - Inter: 400, 500, 600, 700 (removed 300)
   - Outfit: 400, 500, 600, 700 (removed 300, 800, 900)
   - Added font preload and display=swap

2. **Script Optimization**
   - Deferred non-critical scripts (Replit banner) with `defer` attribute
   - Main app script uses `type="module"` for automatic deferring
   - Added modulepreload for main.tsx

3. **Server-Side Compression**
   - Implemented gzip compression middleware in Express server
   - Compression level 6 for optimal balance
   - Applies to all HTTP responses (HTML, CSS, JS, JSON)

4. **Resource Hints**
   - Preconnect to Google Fonts, WhatsApp API
   - DNS prefetch for maps.googleapis.com, google.com
   - Preload critical hero image with fetchpriority="high"
   - Added modulepreload for faster JavaScript execution

5. **Image Optimization Strategy**
   - Hero image preloaded for LCP optimization
   - Boat images use lazy loading (loading="lazy")
   - All images converted to WebP format (88.7% size reduction)

6. **WebP Image Conversion** (October 2025)
   - Converted all PNG images (16.87MB) to WebP format (1.91MB)
   - Reduction: 88.7% (saved 14.95MB)
   - Hero image: 1.41MB → 0.14MB (90% reduction)
   - Individual boat images: 86-90% reduction each
   - Updated all imports in Hero.tsx, FeaturesSection.tsx, BoatCard.tsx, boatImages.ts
   - Updated preload and meta tags in index.html to reference WebP
   - WebP browser support: 97%+ (no fallback needed for modern apps)

7. **Code Splitting & Lazy Loading** (October 2025)
   - Implemented React.lazy() for all non-critical routes and components
   - Lazy loaded components: BookingFlow, CRMDashboard, all boat detail pages, FAQ, legal pages, category pages, location pages
   - Critical components remain static for LCP: Navigation, Hero, FleetSection, FeaturesSection, ContactSection, Footer
   - Suspense boundary with loading spinner for smooth transitions
   - Reduced initial bundle size by moving secondary features to separate chunks

8. **Intelligent Prefetch** (October 2025)
   - Custom usePrefetch hook to warm critical lazy chunks after initial load
   - Prefetches BookingFlow and BoatDetailPage after 2s delay
   - Improves navigation speed without affecting initial load metrics
   - Uses setTimeout to defer prefetch without blocking initial render
   - Cleanup logic prevents duplicate fetches in StrictMode

9. **Route Optimization**
   - Added alternative route paths for better UX (/categoria/*, /destino/*)
   - All pages have canonical tags for SEO protection
   - Duplicate routes reuse same lazy-loaded components for efficiency

### Performance Metrics Baseline
- **FCP (First Contentful Paint)**: 6.4s
- **LCP (Largest Contentful Paint)**: 13.6s
- **TBT (Total Blocking Time)**: 0ms ✓
- **CLS (Cumulative Layout Shift)**: 0 ✓
- **Speed Index**: 6.4s

### Future Optimization Opportunities
1. ~~Image format conversion (PNG → WebP)~~ ✅ **Completed** (88.7% reduction)
2. ~~Code splitting and lazy loading~~ ✅ **Completed** (React.lazy for all secondary routes)
3. ~~Intelligent prefetch of critical routes~~ ✅ **Completed** (usePrefetch hook with 2s delay)
4. Server response time optimization (currently ~6s) - Next priority
5. HTTP caching headers for static assets
6. CDN integration for global asset delivery
7. Consider AVIF format for even better compression (if browser support >90%)
8. Network-aware prefetch (skip on Save-Data or slow connections)