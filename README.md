# Costa Brava Rent a Boat

Boat rental booking platform for the Port of Blanes, Costa Brava (Girona, Spain). Full-stack application with online booking, Stripe payments, WhatsApp chatbot, AI-powered customer support, and a CRM admin panel.

Website: [costabravarentaboat.app](https://costabravarentaboat.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Express.js + Node.js |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Payments | Stripe (PaymentIntents, Webhooks) |
| Messaging | Twilio (WhatsApp Business API) |
| AI | OpenAI (gpt-4o-mini chatbot, text-embedding-3-small RAG) |
| Email | SendGrid |
| Storage | Google Cloud Storage |
| Auth | PIN-based admin, Replit Auth (OIDC) for customers |

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (Neon recommended)
- Stripe account (for payments)

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd costa-brava-rent-a-boat

# Install dependencies
npm install

# Configure environment variables (see table below)
cp .env.example .env  # then edit with your values

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The development server starts at `http://localhost:5000` with hot-reload for both client and server.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `VITE_STRIPE_PUBLIC_KEY` | Yes | Stripe publishable key (client-side) |
| `SENDGRID_API_KEY` | No | SendGrid API key for transactional emails |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID for WhatsApp |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | No | Twilio WhatsApp sender number |
| `OPENAI_API_KEY` | No | OpenAI API key for chatbot and RAG |
| `GCS_BUCKET_NAME` | No | Google Cloud Storage bucket |
| `GCS_PROJECT_ID` | No | Google Cloud project ID |
| `ADMIN_PIN` | Yes | PIN code for CRM admin access |
| `SESSION_SECRET` | Yes | Express session secret |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production (Vite client + esbuild server) |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm run format:check` | Prettier check |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run check:all` | Run all checks (types + lint + format + tests) |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run clean` | Remove dist and Vite cache |

## Project Structure

```
costa-brava-rent-a-boat/
  client/
    src/
      components/      # React components (UI, CRM, booking flow)
      hooks/           # Custom React hooks
      i18n/            # Translations (8 languages)
      lib/             # API client, utilities
      pages/           # Route pages
      utils/           # SEO config, helpers
  server/
    routes/            # Express route handlers
    services/          # Business logic (email, scheduler, blog)
    storage/           # Data access layer (Drizzle ORM)
    whatsapp/          # WhatsApp chatbot with AI
    middleware/        # Express middleware
    lib/               # Logger, utilities
    mcp/               # MCP server integrations
  shared/
    schema.ts          # Drizzle DB schemas + Zod validation
    pricing.ts         # Seasonal pricing calculations
    discounts.ts       # Auto-discount logic
    boatData.ts        # Static boat catalog data
  docs/                # Documentation and design plans
```

## Operational Season

The business operates from April through October. Pricing varies by season:

- **Baja (Low)**: April-June, September-October
- **Media (Mid)**: July
- **Alta (High)**: August

Weekend surcharge of 15% applies on Saturdays and Sundays. Minimum booking duration is 2 hours during Alta season and weekends.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment instructions.

## Documentation

- [API Reference](docs/API_REFERENCE.md)
- [Changelog](docs/CHANGELOG.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
