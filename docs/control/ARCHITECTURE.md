# Architecture

## System Overview

chatOS is a turborepo monorepo providing an AI chatbot (web), multi-platform bot (Chat SDK), and documentation site.

## Module Boundaries

### Apps (consumers)
- **apps/web**: Next.js 16 App Router. Imports from all packages. Owns routes, API handlers, app-specific components.
- **apps/bot**: Next.js API routes. Chat SDK adapters for Slack/Teams/Discord. Imports ai, db, auth packages.
- **apps/docs**: Fumadocs. Imports config and ui packages only.

### Packages (providers)
- **packages/config**: Zero-dependency. Provides tsconfig bases, tailwind presets.
- **packages/types**: Zero-dependency. Shared TypeScript interfaces.
- **packages/db**: Drizzle schema, queries, migrations. Depends on config, types.
- **packages/auth**: Better Auth setup. Depends on config, types, db.
- **packages/ai**: AI SDK models, tools, streaming. Depends on config, types.
- **packages/ui**: shadcn/ui components. Depends on config, types.

## Data Flow

```
User → apps/web → tRPC router → packages/ai (streaming) → AI Gateway → LLM Provider
                              → packages/db (persist) → PostgreSQL
                              → Redis (resumable streams)

User → Platform (Slack) → apps/bot → packages/ai → AI Gateway → LLM Provider
                                   → packages/db → PostgreSQL
```

## Key Invariants

1. Packages never import from apps.
2. No circular dependencies between packages.
3. All database access goes through packages/db.
4. All AI model access goes through packages/ai.
5. All auth goes through packages/auth.
