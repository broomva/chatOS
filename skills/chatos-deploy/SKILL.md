---
name: chatos-deploy
description: Deployment skill for chatOS. Use when deploying to Vercel, running DB migrations, or configuring environments.
---

# chatOS Deployment

## Vercel Deploy

```bash
vercel                 # Deploy preview
vercel --prod          # Deploy production
```

Each app deploys independently via Vercel project linking.

## Environment Variables

Copy `env.example` to `.env.local` and fill in:

**Required:**
- `DATABASE_URL` — PostgreSQL (Neon recommended)
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway key

**Auth (at least one):**
- `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`

**Optional:**
- `REDIS_URL` — for resumable streams
- `BLOB_READ_WRITE_TOKEN` — for file attachments
- `SLACK_BOT_TOKEN` + `SLACK_SIGNING_SECRET` — for bot app

## Database Migrations

```bash
bun run db:generate    # Generate migration from schema changes
bun run db:migrate     # Apply migrations
bun run db:studio      # Open Drizzle Studio
```

## Bot Deployment

The bot app (`apps/bot`) needs webhook URLs configured in each platform:
- Slack: `https://your-bot-domain.vercel.app/api/slack`
