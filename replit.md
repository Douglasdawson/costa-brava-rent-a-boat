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

### Data Storage Solutions
- **Database**: PostgreSQL using Neon serverless database with connection pooling
- **ORM**: Drizzle ORM with Neon serverless adapter for type-safe database operations
- **Schema Management**: Centralized schema definitions in TypeScript with Zod validation
- **Migrations**: Drizzle Kit for database schema migrations and management

### Authentication and Authorization
- **User Management**: Basic user system with username/password authentication
- **Session Handling**: Planned session-based authentication (infrastructure in place)
- **Role-based Access**: Designed for ADMIN and STAFF roles for CRM access

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