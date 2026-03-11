# Deployment Guide

Production deployment instructions for Costa Brava Rent a Boat.

## Build Process

```bash
# Install dependencies
npm install

# Push database schema (if there are new migrations)
npm run db:push

# Build for production
npm run build
```

The build command produces:
- `dist/index.js` - Bundled server (esbuild, ESM format)
- `dist/public/` - Static client assets (Vite build)

## Environment Requirements

- **Runtime**: Node.js 20+
- **Database**: PostgreSQL 15+ (Neon serverless recommended)
- **Memory**: 512MB minimum, 1GB recommended
- **Port**: Configurable via `PORT` env var (default: 5000)

All environment variables listed in the [README](../README.md#environment-variables) must be set in the production environment. At minimum:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `VITE_STRIPE_PUBLIC_KEY`
- `ADMIN_PIN`
- `SESSION_SECRET`
- `NODE_ENV=production`

## Running in Production

```bash
NODE_ENV=production node dist/index.js
```

The server serves both the API and the static client files from a single process.

## Database Migrations

This project uses Drizzle ORM with a push-based migration strategy:

```bash
# Apply schema changes to the database
npm run db:push
```

Run this before deploying whenever `shared/schema.ts` has been modified. Drizzle Kit will compare the schema definition against the live database and apply the necessary ALTER statements.

## Health Check

The application exposes a health endpoint at:

```
GET /api/health
```

Use this for load balancer health checks and uptime monitoring.

## Stripe Webhooks

Configure a Stripe webhook endpoint pointing to:

```
POST /api/stripe-webhook
```

Required events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

The endpoint expects the raw request body for signature verification. Ensure your reverse proxy or hosting platform does not parse the body before it reaches Express.

## SSL/TLS

The application does not terminate TLS itself. Use a reverse proxy (nginx, Cloudflare, or your hosting platform's built-in TLS) to handle HTTPS. The app should run behind the proxy on HTTP.

Ensure the `X-Forwarded-Proto` header is set so Express can detect HTTPS connections for secure cookies.

## Replit Deployment

The project is configured for Replit hosting:

1. Environment variables are set in the Replit Secrets panel
2. The `.replit` file configures the run command
3. Replit handles TLS termination and domain routing
4. The app binds to `0.0.0.0:5000` (Replit's expected port)

## Scheduled Tasks

The server runs a scheduler service (`server/services/schedulerService.ts`) that handles:
- Expired hold cleanup (every 5 minutes)
- Booking reminders
- Blog autopilot

These run in-process via `node-cron` and require no external cron setup.

## Monitoring

- **Error tracking**: Sentry (configure `SENTRY_DSN`)
- **Logs**: Structured JSON logging via the built-in logger
- **Health**: `GET /api/health` endpoint

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common deployment issues and solutions.
