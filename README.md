# chatOS

A best-in-class AI chatbot monorepo template with streaming, multi-model support, and multi-platform bots.

Built with [Turborepo](https://turbo.build), [Next.js 16](https://nextjs.org), [Vercel AI SDK](https://sdk.vercel.ai), [Better Auth](https://better-auth.com), [Drizzle ORM](https://orm.drizzle.team), and [Chat SDK](https://chat-sdk.dev).

## Features

- **Multi-model AI chat** — Claude, GPT, Gemini, Grok via Vercel AI Gateway
- **Streaming** — Real-time responses with resumable streams (Redis-backed)
- **Tool calling** — Extensible tool system (weather, documents, web search)
- **Multi-platform bots** — Slack, Teams, Discord via Chat SDK
- **Type-safe** — End-to-end with tRPC, Drizzle, Zod
- **Agent-native** — Control metalayer, harness engineering, skills for AI-assisted development
- **Monorepo** — Turborepo with caching, shared packages, parallel builds

## Quick Start

```bash
# Clone
git clone https://github.com/broomva/chatOS.git
cd chatOS

# Install
bun install

# Configure
cp env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, AI_GATEWAY_API_KEY

# Develop
turbo dev
```

Apps start on:
- **Web chatbot**: http://localhost:3000
- **Bot service**: http://localhost:3001
- **Documentation**: http://localhost:3002

## Architecture

```
chatOS/
├── apps/
│   ├── web/          Next.js AI chatbot
│   ├── bot/          Chat SDK multi-platform bot
│   └── docs/         Fumadocs documentation
├── packages/
│   ├── ai/           AI SDK models, tools, streaming
│   ├── auth/         Better Auth configuration
│   ├── config/       Shared tsconfig, tailwind presets
│   ├── db/           Drizzle schema, queries, migrations
│   ├── types/        Shared TypeScript types
│   └── ui/           shadcn/ui shared components
├── .control/         Agent governance (policy, commands, topology)
├── docs/control/     Architecture, observability, control loop
├── scripts/control/  Deterministic command wrappers
├── skills/           Project-local agent skills
└── evals/            Control metrics
```

## Commands

| Command | Description |
|---|---|
| `bun install` | Install all dependencies |
| `turbo dev` | Start all apps in development |
| `turbo build` | Build all packages and apps |
| `make smoke` | Environment + build sanity check |
| `make check` | Lint (Biome) + typecheck |
| `make test` | Full test suite |
| `make control-audit` | Validate agent governance artifacts |

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + Bun |
| Framework | Next.js 16 (App Router) |
| AI | Vercel AI SDK + AI Gateway |
| Auth | Better Auth |
| Database | PostgreSQL + Drizzle ORM |
| Cache | Redis (Upstash) |
| UI | shadcn/ui + Radix + Tailwind v4 |
| Bot | Chat SDK (Slack, Teams, Discord) |
| Lint | Biome |
| Test | Vitest + Playwright |
| Docs | Fumadocs |
| CI/CD | GitHub Actions |

## Agent-Native Development

This repo is designed for AI-assisted development with:

- **AGENTS.md** — Command surface and rules for AI agents
- **PLANS.md** — Durable planning for multi-step tasks
- **METALAYER.md** — Control-loop setpoints and feedback
- **CLAUDE.md** — Project context for Claude Code
- **.control/** — Policy, commands, topology YAML
- **skills/** — Project-local skills for development guidance
- **Makefile.control** — Deterministic gate commands (`smoke` → `check` → `test`)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
