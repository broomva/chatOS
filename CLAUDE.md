# chatOS

Turborepo monorepo: AI chatbot + multi-platform bot + docs.

## Quick Commands

| Intent | Command |
|---|---|
| Install deps | `bun install` |
| Build everything | `turbo build` |
| Dev (all apps) | `turbo dev` |
| Env + build sanity | `make smoke` |
| Lint + typecheck | `make check` |
| Full test suite | `make test` |
| Control audit | `make control-audit` |

## Workspace Layout

| Path | Description | Port |
|---|---|---|
| `apps/web` | Next.js AI chatbot | 3000 |
| `apps/bot` | Chat SDK multi-platform bot | 3001 |
| `apps/docs` | Fumadocs documentation | 3002 |
| `packages/config` | Shared tsconfig, biome, tailwind presets | — |
| `packages/types` | Shared TypeScript types | — |
| `packages/db` | Drizzle ORM schema + queries | — |
| `packages/auth` | Better Auth config | — |
| `packages/ai` | AI SDK models, tools, streaming | — |
| `packages/ui` | shadcn/ui shared components | — |

## Conventions

- **Package manager**: Bun. Never npm/yarn/pnpm.
- **Lint + format**: Biome. Never eslint/prettier.
- **Database**: PostgreSQL + Drizzle ORM. Schema in `packages/db/src/schema.ts`.
- **Auth**: Better Auth. Config in `packages/auth/`.
- **AI**: Vercel AI SDK + AI Gateway. Models in `packages/ai/src/models.ts`.
- **UI**: shadcn/ui + Radix + Tailwind v4. Components in `packages/ui/`.
- **API**: tRPC for type-safe routes in `apps/web`.
- **Streaming**: Resumable streams via Redis in `packages/ai/src/streaming.ts`.

## Before Committing

1. `make smoke` — environment + build sanity
2. `make check` — lint + typecheck
3. `make test` — full verification

See `AGENTS.md` for full rules and gate sequence.

## Skills

- Project skills: `./skills/` — development guidance for agents
- Published: `broomva/agent-control-metalayer-skill`, `broomva/harness-engineering-skill`

## Dependency Graph

```
packages/config, packages/types (leaf — no deps)
  → packages/db (config, types)
  → packages/auth (config, types, db)
  → packages/ai (config, types)
  → packages/ui (config, types)
    → apps/web (ui, db, ai, auth)
    → apps/bot (ai, db, auth)
    → apps/docs (config, ui)
```
